import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import GraphQLJSON from 'graphql-type-json';
import { HealthModule } from '../health/health.module';
import { ShopModule } from '../shop/shop.module';
import { EventsModule } from '../events/events.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { GraphqlApiResolver } from './graphql-api.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql',
      autoSchemaFile: true,
      sortSchema: true,
      resolvers: { JSON: GraphQLJSON },
      introspection: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    HealthModule,
    ShopModule,
    EventsModule,
    AchievementsModule,
  ],
  providers: [GraphqlApiResolver],
})
export class GraphqlModule {}
