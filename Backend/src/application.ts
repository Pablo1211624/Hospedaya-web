import { createApp } from './app.js';
import { lodgings, hosts } from './lodgings.js';
import { reservations, reservationHosts } from './reservations.js';
export const app = createApp(app => {
  app.use('/api/alojamientos', lodgings);
  app.use('/api/reservas', reservations);
  app.use('/api/anfitrion', hosts);
  app.use('/api/anfitrion', reservationHosts);
});
