import {
    PipeTransform,
    ArgumentMetadata,
    BadRequestException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    transform(value: any, metadata: ArgumentMetadata) {
        // TODO: Implement validation with class-validator and class-transformer
        // Install: npm install class-validator class-transformer
        // Then uncomment and implement the validation logic below

        // if (!metatype || !this.toValidate(metatype)) {
        //   return value;
        // }
        // const object = plainToInstance(metatype, value);
        // const errors = await validate(object);
        // if (errors.length > 0) {
        //   throw new BadRequestException('Validation failed');
        // }

        return value;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}

