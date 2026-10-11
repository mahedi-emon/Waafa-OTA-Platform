import { type DynamicModule, Module } from "@nestjs/common";
import type { Fetcher } from "./catalogAdapters";
import { AdminProvidersController } from "./providers.controller";
import { PROVIDER_FETCH, ProvidersService } from "./providers.service";

/** External API connections and the provider adapters (#82); tests pass a fake fetch for the health check. */
@Module({})
export class ProvidersModule {
  static register(options: { fetcher?: Fetcher } = {}): DynamicModule {
    const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init));
    return {
      module: ProvidersModule,
      controllers: [AdminProvidersController],
      providers: [ProvidersService, { provide: PROVIDER_FETCH, useValue: fetcher }],
      exports: [ProvidersService],
    };
  }
}
