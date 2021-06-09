using {csw} from '../db/schema';

@(requires : 'authenticated-user')
service BeershopAdminService {

  entity Beers     as projection on csw.Beers;
  entity Breweries as projection on csw.Brewery;

  @readonly
  entity UserScopes {
    key username : String;
        is_admin : Boolean;
  };
}
