import * as assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

import { parse } from '@babel/parser';

import { PatternDetector } from '../../../dist/analyzers/pattern-detector.js';
import { ParsemeConfig } from '../../../dist/config.js';

describe('PatternDetector', () => {
  let detector: PatternDetector;
  let config: ParsemeConfig;

  beforeEach(() => {
    config = new ParsemeConfig();
    detector = new PatternDetector(config);
  });

  describe('endpoint detection', () => {
    test('should detect decorator-based routes', () => {
      const code = `
        class UserController {
          @Get('/users')
          getUsers() {
            return [];
          }
          
          @Post('/users')
          createUser() {
            return {};
          }
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'decorators-legacy'],
      });

      const patterns = detector.analyzePatterns(ast, 'user.controller.ts', code);

      assert.strictEqual(patterns.endpoints.length, 2);
      assert.strictEqual(patterns.endpoints[0].method, 'GET');
      assert.strictEqual(patterns.endpoints[0].path, '/users');
      assert.strictEqual(patterns.endpoints[1].method, 'POST');
      assert.strictEqual(patterns.endpoints[1].path, '/users');
    });

    test('should detect Express-style routes', () => {
      const code = `
        const express = require('express');
        const app = express();
        
        app.get('/api/users', (req, res) => {
          res.json([]);
        });
        
        app.post('/api/users', (req, res) => {
          res.json({});
        });
        
        app.put('/api/users/:id', (req, res) => {
          res.json({});
        });
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'routes.js', code);

      assert.strictEqual(patterns.endpoints.length, 3);
      assert.strictEqual(patterns.endpoints[0].method, 'GET');
      assert.strictEqual(patterns.endpoints[0].path, '/api/users');
      assert.strictEqual(patterns.endpoints[1].method, 'POST');
      assert.strictEqual(patterns.endpoints[2].method, 'PUT');
      assert.strictEqual(patterns.endpoints[2].path, '/api/users/:id');
    });

    test('should detect router methods', () => {
      const code = `
        const router = express.Router();
        
        router.delete('/items/:id', (req, res) => {
          res.status(204).send();
        });
        
        router.patch('/items/:id', (req, res) => {
          res.json({});
        });
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'item-routes.js', code);

      assert.strictEqual(patterns.endpoints.length, 2);
      assert.strictEqual(patterns.endpoints[0].method, 'DELETE');
      assert.strictEqual(patterns.endpoints[1].method, 'PATCH');
    });
  });

  describe('component detection', () => {
    test('should detect React functional components', () => {
      const code = `
        import React from 'react';
        
        function UserCard({ user }) {
          return <div>{user.name}</div>;
        }
        
        const UserList = () => {
          return <ul><li>Users</li></ul>;
        };

        function RegularFunction() {
          return "not jsx";
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
      });

      const patterns = detector.analyzePatterns(ast, 'UserCard.jsx', code);

      assert.strictEqual(patterns.components.length, 1); // Only UserCard has JSX return
      assert.strictEqual(patterns.components[0].name, 'UserCard');
    });

    test('should detect React class components', () => {
      const code = `
        import React, { Component } from 'react';
        
        class UserProfile extends Component {
          render() {
            return <div>Profile</div>;
          }
        }

        class RegularClass {
          process() {
            return "not a component";
          }
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
      });

      const patterns = detector.analyzePatterns(ast, 'UserProfile.jsx', code);

      assert.strictEqual(patterns.components.length, 1);
      assert.strictEqual(patterns.components[0].name, 'UserProfile');
    });
  });

  describe('service detection', () => {
    test('should detect service classes with Injectable decorator', () => {
      const code = `
        @Injectable()
        class UserService {
          constructor(private userRepository: UserRepository) {}
          
          async findAll() {
            return this.userRepository.findAll();
          }
          
          async create(user) {
            return this.userRepository.save(user);
          }
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'decorators-legacy'],
      });

      const patterns = detector.analyzePatterns(ast, 'user.service.ts', code);

      assert.strictEqual(patterns.services.length, 1);
      assert.strictEqual(patterns.services[0].name, 'UserService');
      assert.strictEqual(patterns.services[0].type, 'class');
      assert.ok(patterns.services[0].methods.includes('findAll'));
      assert.ok(patterns.services[0].methods.includes('create'));
    });

    test('should detect service classes by naming convention', () => {
      const code = `
        class DataRepository {
          async save(data) {
            return data;
          }
        }
        
        class EmailManager {
          send(email) {
            console.log('Sending email');
          }
        }

        class RegularClass {
          doSomething() {}
        }
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'services.js', code);

      assert.strictEqual(patterns.services.length, 2);
      assert.strictEqual(patterns.services[0].name, 'DataRepository');
      assert.strictEqual(patterns.services[1].name, 'EmailManager');
    });
  });

  describe('model detection', () => {
    test('should detect TypeScript interfaces', () => {
      const code = `
        interface User {
          id: string;
          name: string;
          email: string;
        }
        
        interface Product {
          id: number;
          title: string;
          price: number;
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript'],
      });

      const patterns = detector.analyzePatterns(ast, 'models.ts', code);

      assert.strictEqual(patterns.models.length, 2);
      assert.strictEqual(patterns.models[0].name, 'User');
      assert.strictEqual(patterns.models[0].type, 'interface');
      assert.ok(patterns.models[0].fields.includes('id'));
      assert.ok(patterns.models[0].fields.includes('name'));
      assert.ok(patterns.models[0].fields.includes('email'));
    });

    test('should detect type aliases', () => {
      const code = `
        type Status = 'active' | 'inactive';
        type UserRole = 'admin' | 'user' | 'guest';
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript'],
      });

      const patterns = detector.analyzePatterns(ast, 'types.ts', code);

      assert.strictEqual(patterns.models.length, 2);
      assert.strictEqual(patterns.models[0].name, 'Status');
      assert.strictEqual(patterns.models[0].type, 'type');
      assert.strictEqual(patterns.models[1].name, 'UserRole');
    });
  });

  describe('middleware detection', () => {
    test('should detect middleware functions', () => {
      const code = `
        function authMiddleware(req, res, next) {
          // Check auth
          next();
        }
        
        function corsMiddleware(request, response, next) {
          response.header('Access-Control-Allow-Origin', '*');
          next();
        }

        function regularFunction(a, b) {
          return a + b;
        }
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'middleware.js', code);

      assert.strictEqual(patterns.middleware.length, 2);
      assert.strictEqual(patterns.middleware[0].name, 'authMiddleware');
      assert.strictEqual(patterns.middleware[0].type, 'function');
      assert.strictEqual(patterns.middleware[1].name, 'corsMiddleware');
    });

    // Context-based middleware (Koa-style) detection not yet implemented
    // TODO: Add support for 2-parameter middleware (ctx, next)
  });

  describe('utility detection', () => {
    test('should detect React hooks', () => {
      const code = `
        import { useState } from 'react';
        
        function useCounter(initial = 0) {
          const [count, setCount] = useState(initial);
          return { count, increment: () => setCount(c => c + 1) };
        }
        
        function useLocalStorage(key, defaultValue) {
          // Hook implementation
        }

        function regularFunction() {
          // Not a hook
        }
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'hooks.js', code);

      assert.strictEqual(patterns.utilities.length, 2);
      assert.strictEqual(patterns.utilities[0].name, 'useCounter');
      assert.strictEqual(patterns.utilities[0].type, 'hook');
      assert.strictEqual(patterns.utilities[1].name, 'useLocalStorage');
    });
  });

  describe('edge cases', () => {
    test('should handle empty files', () => {
      const code = '';

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'empty.js', code);

      assert.strictEqual(patterns.endpoints.length, 0);
      assert.strictEqual(patterns.components.length, 0);
      assert.strictEqual(patterns.services.length, 0);
      assert.strictEqual(patterns.models.length, 0);
      assert.strictEqual(patterns.middleware.length, 0);
      assert.strictEqual(patterns.utilities.length, 0);
    });

    test('should handle files with only imports/exports', () => {
      const code = `
        import { something } from 'somewhere';
        export { something };
      `;

      const ast = parse(code, { sourceType: 'module' });
      const patterns = detector.analyzePatterns(ast, 'reexports.js', code);

      // Should not detect any patterns for pure re-exports
      assert.strictEqual(patterns.endpoints.length, 0);
      assert.strictEqual(patterns.components.length, 0);
      assert.strictEqual(patterns.services.length, 0);
    });

    test('should handle complex nested structures', () => {
      const code = `
        class ApiController {
          @Get('/api/data')
          getData() {
            return this.dataService.findAll();
          }
          
          constructor(private dataService: DataService) {}
        }
        
        @Injectable()
        class DataService {
          findAll() {
            return [];
          }
        }
      `;

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'decorators-legacy'],
      });

      const patterns = detector.analyzePatterns(ast, 'api.controller.ts', code);

      assert.strictEqual(patterns.endpoints.length, 1);
      assert.strictEqual(patterns.services.length, 1);
      assert.strictEqual(patterns.endpoints[0].path, '/api/data');
      assert.strictEqual(patterns.services[0].name, 'DataService');
    });
  });
});
