"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const channel_module_1 = require("./channel/channel.module");
const message_module_1 = require("./message/message.module");
const chat_gateway_1 = require("./chat/chat.gateway");
const user_entity_1 = require("./entities/user.entity");
const channel_entity_1 = require("./entities/channel.entity");
const message_entity_1 = require("./entities/message.entity");
const utils_module_1 = require("./utils/utils.module");
const user_presence_entity_1 = require("./entities/user-presence.entity");
const presence_module_1 = require("./presence/presence.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_NAME'),
                    entities: [user_entity_1.User, channel_entity_1.Channel, message_entity_1.Message, user_presence_entity_1.UserPresence],
                    synchronize: false,
                    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                    migrationsRun: true,
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            channel_module_1.ChannelModule,
            message_module_1.MessageModule,
            utils_module_1.UtilsModule,
            presence_module_1.PresenceModule,
        ],
        providers: [chat_gateway_1.ChatGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map