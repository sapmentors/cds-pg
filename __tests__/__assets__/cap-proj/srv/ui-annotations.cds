using {BeershopService} from '../srv/beershop-service';

annotate BeershopService.TypeChecksWithDraft with @(
  Common.SemanticKey : [ID],
  Identification     : [{Value : code}],
  UI                 : {
    SelectionFields     : [
      type_String,
      type_Date
    ],
    LineItem            : [
      {Value : type_String},
      {Value : type_Date},
    ],
    HeaderInfo          : {
      TypeName       : '{i18n>TypeCheck}',
      TypeNamePlural : '{i18n>TypeChecks}',
      Title          : {Value : type_String},
      Description    : {Value : type_Date}
    },
    Facets              : [{
      $Type  : 'UI.ReferenceFacet',
      Label  : '{i18n>Details}',
      Target : '@UI.FieldGroup#Details'
    }, ],
    FieldGroup #Details : {Data : [
      {Value : type_Boolean},
      {Value : type_Int32},
      {Value : type_Int64},
      {Value : type_Decimal},
      {Value : type_Double},
      {Value : type_Date},
      {Value : type_Time},
      {Value : type_DateTime},
      {Value : type_Timestamp},
      {Value : type_String},
      {Value : type_LargeString},
    ]},
  }
);
