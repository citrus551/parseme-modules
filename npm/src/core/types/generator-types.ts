// Types related to generator output and context building

export interface ContextOutput {
  parseme: string; // Main PARSEME.md content
  context?: {
    // Optional parseme-context/ folder files
    structure: string;
    routes: string;
    [key: string]: string;
  };
}
