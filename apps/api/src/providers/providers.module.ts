import { type DynamicModule, Module } from "@nestjs/common";
import { probePort, type Fetcher, type PortProbe } from "./catalogAdapters";
import { AdminProvidersController, PublicIntegrationsController } from "./providers.controller";
import { PROVIDER_FETCH, PROVIDER_PROBE, ProvidersService } from "./providers.service";

/**
 * External API connections and the provider adapters (#82, #107); tests pass a fake fetch and port probe for the
 * health checks.
 */
@Module({})
export class ProvidersModule {
  static register(options: { fetcher?: Fetcher; probe?: PortProbe } = {}): DynamicModule {
    const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init));
    return {
      module: ProvidersModule,
      controllers: [AdminProvidersController, PublicIntegrationsController],
      providers: [
        ProvidersService,
        { provide: PROVIDER_FETCH, useValue: fetcher },
        { provide: PROVIDER_PROBE, useValue: options.probe ?? probePort },
      ],
      exports: [ProvidersService],
    };
  }
}
