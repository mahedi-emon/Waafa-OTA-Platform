import { type DynamicModule, Module } from "@nestjs/common";
import { CustomersController } from "../customers/customers.controller";
import { CustomersService, GOOGLE_FETCH } from "../customers/customers.service";
import type { GoogleFetch } from "../customers/googleOAuth";
import { probePort, type Fetcher, type PortProbe } from "./catalogAdapters";
import { AdminProvidersController, PublicIntegrationsController } from "./providers.controller";
import { PROVIDER_FETCH, PROVIDER_PROBE, ProvidersService } from "./providers.service";

/**
 * External API connections and the provider adapters (#82, #107), and customer sign-in built on the Google
 * connection (issue 134); tests pass a fake fetch, port probe and Google token endpoint.
 */
@Module({})
export class ProvidersModule {
  static register(
    options: { fetcher?: Fetcher; probe?: PortProbe; googleFetch?: GoogleFetch } = {},
  ): DynamicModule {
    const fetcher: Fetcher = options.fetcher ?? ((url, init) => fetch(url, init));
    const googleFetch: GoogleFetch = options.googleFetch ?? ((url, init) => fetch(url, init));
    return {
      module: ProvidersModule,
      controllers: [AdminProvidersController, PublicIntegrationsController, CustomersController],
      providers: [
        ProvidersService,
        CustomersService,
        { provide: PROVIDER_FETCH, useValue: fetcher },
        { provide: PROVIDER_PROBE, useValue: options.probe ?? probePort },
        { provide: GOOGLE_FETCH, useValue: googleFetch },
      ],
      exports: [ProvidersService],
    };
  }
}
