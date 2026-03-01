import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <h1>Welcome to the Price Query Service</h1>
      <p>This service provides real-time and historical cryptocurrency price data.</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>GET /v1/price/:coinId</strong> - Get the current price of a cryptocurrency (e.g., <code>/v1/price/bitcoin</code>)</li>
        <li><strong>GET /v1/price/:coinId/history</strong> - Get historical price records for a cryptocurrency</li>
      </ul>
      
      <p>Check the <a href="/docs">Swagger documentation</a> for more details.</p>
    `;
  }
}
