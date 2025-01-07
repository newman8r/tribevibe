"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const user_service_1 = require("../user/user.service");
const channel_service_1 = require("../channel/channel.service");
let ChatGateway = class ChatGateway {
    constructor(userService, channelService) {
        this.userService = userService;
        this.channelService = channelService;
    }
    async handleJoinChannel(data, client) {
        if (data.userId.startsWith('anonymous-')) {
            client.join(data.channelId);
            client.emit('joinedChannel', { channelId: data.channelId });
            return;
        }
        const user = await this.userService.findOne(data.userId);
        const channel = await this.channelService.findOne(data.channelId);
        if (user && channel) {
            await this.channelService.addUserToChannel(channel, user);
            client.join(data.channelId);
            client.emit('joinedChannel', { channelId: data.channelId });
        }
    }
    async handleMessage(data, client) {
        if (data.userId.startsWith('anonymous-')) {
            const message = {
                user: { id: data.userId, username: 'Anonymous User' },
                content: data.content,
                createdAt: new Date(),
            };
            this.server.to(data.channelId).emit('newMessage', message);
            return;
        }
        const user = await this.userService.findOne(data.userId);
        const channel = await this.channelService.findOne(data.channelId);
        if (user && channel) {
            const message = {
                user: { id: user.id, username: user.username },
                content: data.content,
                createdAt: new Date(),
            };
            this.server.to(data.channelId).emit('newMessage', message);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinChannel'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['my-custom-header'],
            preflightContinue: false,
            optionsSuccessStatus: 204
        },
        transports: ['websocket', 'polling']
    }),
    __metadata("design:paramtypes", [user_service_1.UserService,
        channel_service_1.ChannelService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map