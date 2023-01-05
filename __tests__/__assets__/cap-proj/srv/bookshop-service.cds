using my.bookshop as my from '../db/bookshop-model';

service BookshopService {
    @readonly
    entity Books   as projection on my.Books;

    @readonly
    entity Authors as projection on my.Authors;
}
