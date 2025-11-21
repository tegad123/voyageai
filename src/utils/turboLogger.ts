/* eslint-disable no-underscore-dangle */
import { NativeModules } from 'react-native';

declare global {
  // eslint-disable-next-line no-var
  var __VOYAGE_TURBO_LOGGER_ENABLED__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __turboModuleProxy: ((name: string) => any) | undefined;
}

if (!global.__VOYAGE_TURBO_LOGGER_ENABLED__) {
  let legacyWrapped = false;
  const proxy = global.__turboModuleProxy;
  if (typeof proxy === 'function') {
    console.log('[TurboLogger] Wrapping __turboModuleProxy for debug logging');
    global.__turboModuleProxy = (name: string) => {
      console.log(`[TurboLogger] [Turbo] Requesting module "${name}"`);
      try {
        const module = proxy(name);
        if (!module) {
          console.warn(`[TurboLogger] [Turbo] Module "${name}" returned null`);
        }
        return module;
      } catch (error) {
        console.error(`[TurboLogger] [Turbo] Error loading module "${name}"`, error);
        throw error;
      }
    };
  } else {
    console.log('[TurboLogger] __turboModuleProxy not available (legacy architecture)');
    // wrap NativeModules getter for legacy architecture
    if (NativeModules && !legacyWrapped) {
      const handler: ProxyHandler<typeof NativeModules> = {
        get(target, prop, receiver) {
          const result = Reflect.get(target, prop, receiver);
          if (typeof prop === 'string') {
            console.log(`[TurboLogger] [Legacy] Accessing module "${prop}" (${result ? 'ok' : 'undefined'})`);
          }
          return result;
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proxied = new Proxy(NativeModules as any, handler);
      // Overwrite global NativeModules reference
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).NativeModules = proxied;
      legacyWrapped = true;
    }
  }
  global.__VOYAGE_TURBO_LOGGER_ENABLED__ = true;
}

export {};

