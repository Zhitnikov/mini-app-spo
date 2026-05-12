import { Args, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { HealthService } from '../health/health.service';
import { ShopService } from '../shop/shop.service';
import { EventsService } from '../events/events.service';
import { AchievementsService } from '../achievements/achievements.service';

@Resolver()
export class GraphqlApiResolver {
  constructor(
    private readonly healthService: HealthService,
    private readonly shopService: ShopService,
    private readonly eventsService: EventsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @Query(() => GraphQLJSON, {
    name: 'health',
    description: 'Эквивалент GET /api/health',
  })
  apiHealth(): unknown {
    return this.healthService.getHealth();
  }

  @Query(() => GraphQLJSON, {
    name: 'shopItems',
    description: 'Эквивалент GET /api/shop',
  })
  shopItems(
    @Args('type', { nullable: true, type: () => String }) type?: string,
  ): Promise<unknown> {
    return this.shopService.getAllItems(type);
  }

  @Query(() => GraphQLJSON, {
    name: 'achievements',
    description: 'Эквивалент GET /api/achievements',
  })
  achievements(): Promise<unknown> {
    return this.achievementsService.getAllAchievements();
  }

  @Query(() => GraphQLJSON, {
    name: 'events',
    description: 'Эквивалент GET /api/events?status=…',
  })
  events(
    @Args('status', { nullable: true, type: () => String }) status?: string,
  ): Promise<unknown> {
    return this.eventsService.getAll(status || 'APPROVED');
  }
}
