import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { ProducerService } from './producer.service';

@Module({
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService],
})
export class QueueModule {}
