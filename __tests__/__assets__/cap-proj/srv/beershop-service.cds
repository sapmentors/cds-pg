using {csw} from '../db/schema';

service BeershopService {

  entity Beers               as projection on csw.Beers;
  entity Breweries           as projection on csw.Brewery;
  entity TypeChecks          as projection on csw.TypeChecks;

  @odata.draft.enabled
  entity TypeChecksWithDraft as projection on csw.TypeChecks;
}

extend service BeershopService with {
  action reset();
  action createBeer();
}
