using { csw } from '../db/schema';

service BeershopService {

  entity Beers as projection on csw.Beers;
  entity Breweries as projection on csw.Brewery;
}