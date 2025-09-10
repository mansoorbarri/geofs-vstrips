import '@clerk/nextjs/server';
import { ClerkUserPublicMetadata } from '@clerk/types';

// Extend the existing ClerkUserPublicMetadata type with your custom fields
declare module '@clerk/nextjs' {
  interface ClerkUserPublicMetadata {
    controller?: boolean;
  }
}

declare module '@clerk/nextjs/server' {
  interface SessionClaims {
    publicMetadata?: {
      controller?: boolean;
    };
  }
}