CREATE TABLE user_information(
    id serial primary key,
    bio varchar( 300 ),
    domain varchar( 25 ),
    email varchar( 255 ) UNIQUE NOT NULL,
    name varchar ( 50 ),
    password varchar ( 80 ) NOT NULL,
    phone varchar ( 10 ) UNIQUE
);
