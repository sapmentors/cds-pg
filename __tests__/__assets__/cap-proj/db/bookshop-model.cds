namespace my.bookshop;

entity Books {
  key ID     : Integer;
      title  : localized String;
      author : Association to Authors;
      stock  : Integer;
}

entity Authors {
  key ID    : Integer;
      name  : localized String;
      books : Association to many Books
                on books.author = $self;
}
