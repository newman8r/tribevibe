import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(userData: Partial<User>): Promise<User>;
    findOne(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: string, updateData: Partial<User>): Promise<User | null>;
    delete(id: string): Promise<void>;
}
