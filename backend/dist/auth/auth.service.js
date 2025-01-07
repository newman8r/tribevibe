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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("@nestjs/config");
const user_service_1 = require("../user/user.service");
const channel_service_1 = require("../channel/channel.service");
let AuthService = class AuthService {
    constructor(configService, userService, channelService) {
        this.configService = configService;
        this.userService = userService;
        this.channelService = channelService;
        const supabaseUrl = this.configService.getOrThrow('SUPABASE_URL');
        const supabaseKey = this.configService.getOrThrow('SUPABASE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration is missing');
        }
        try {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
        catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            throw new Error('Failed to initialize Supabase client');
        }
    }
    async signUp(email, password, ticketId) {
        const { data: authData, error } = await this.supabase.auth.signUp({
            email,
            password,
        });
        if (error) {
            throw new Error(error.message);
        }
        if (!authData.user)
            throw new Error('Failed to create user');
        const newUser = await this.userService.create({
            username: email.split('@')[0],
            ticketId: ticketId,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
        });
        const welcomeChannel = await this.channelService.findOne('cae31388-5a90-4506-98fb-288f34ca0f40');
        if (welcomeChannel) {
            await this.channelService.addUserToChannel(welcomeChannel, newUser);
        }
        return {
            user: newUser,
            session: authData.session,
        };
    }
    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            throw new Error(error.message);
        }
        return data.user;
    }
    async validateToken(token) {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error) {
            throw new Error(error.message);
        }
        return data.user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_service_1.UserService,
        channel_service_1.ChannelService])
], AuthService);
//# sourceMappingURL=auth.service.js.map