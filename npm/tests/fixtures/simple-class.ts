import { EventEmitter } from 'events';

export interface UserData {
  id: number;
  name: string;
  email: string;
}

export class UserService extends EventEmitter {
  private users: UserData[] = [];

  constructor() {
    super();
  }

  addUser(userData: UserData): void {
    this.users.push(userData);
    this.emit('userAdded', userData);
  }

  getUserById(id: number): UserData | undefined {
    return this.users.find((user) => user.id === id);
  }

  getAllUsers(): UserData[] {
    return [...this.users];
  }

  deleteUser(id: number): boolean {
    const index = this.users.findIndex((user) => user.id === id);
    if (index > -1) {
      const user = this.users.splice(index, 1)[0];
      this.emit('userDeleted', user);
      return true;
    }
    return false;
  }
}
