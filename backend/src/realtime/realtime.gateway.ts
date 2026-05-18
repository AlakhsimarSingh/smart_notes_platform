import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection
{
  @WebSocketServer()
  server!: Server;

  handleConnection(
    client: Socket,
  ) {
    console.log(
      'Client connected'
    );
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() userId: string,
    @ConnectedSocket()
    client: Socket,
  ) {
    client.join(userId);

    console.log(
      `Client joined room ${userId}`
    );
  }

  sendNoteUpdate(
    userId: string,
    note: any,
  ) {
    this.server
      .to(userId)
      .emit('noteUpdated', note);
  }
}