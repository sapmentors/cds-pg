namespace csw;
using { cuid } from '@sap/cds/common';

entity Beers : cuid {
  name: String(100);
  abv: Decimal(3, 1);
  ibu: Integer;
  brewery: Association to one Brewery;
}

entity Brewery : cuid {
  name: String(150);
  beers: Association to many Beers on beers.brewery = $self;
}