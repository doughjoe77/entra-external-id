CREATE DATABASE books;

\c books;

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    birth_year INTEGER
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    author_id INTEGER NOT NULL REFERENCES authors(id)
);

-- Seed data
INSERT INTO authors (name, country, birth_year) VALUES
  ('Isaac Asimov', 'USA', 1920),
  ('Arthur C. Clarke', 'UK', 1917),
  ('Philip K. Dick', 'USA', 1928),
  ('Ursula K. Le Guin', 'USA', 1929),
  ('Frank Herbert', 'USA', 1920),
  ('J.R.R. Tolkien', 'UK', 1892),
  ('Michael Moorcock', 'UK', 1939);

INSERT INTO books (title, year, author_id) VALUES
  -- Asimov
  ('Foundation', 1951, 1),
  ('Foundation and Empire', 1952, 1),
  ('Second Foundation', 1953, 1),
  ('I, Robot', 1950, 1),

  -- Clarke
  ('Childhood''s End', 1953, 2),
  ('Rendezvous with Rama', 1973, 2),
  ('2001: A Space Odyssey', 1968, 2),

  -- PKD
  ('Do Androids Dream of Electric Sheep?', 1968, 3),
  ('Ubik', 1969, 3),
  ('The Man in the High Castle', 1962, 3),

  -- Le Guin
  ('A Wizard of Earthsea', 1968, 4),
  ('The Left Hand of Darkness', 1969, 4),
  ('The Dispossessed', 1974, 4),

  -- Frank Herbert – Dune Saga
  ('Dune', 1965, 5),
  ('Dune Messiah', 1969, 5),
  ('Children of Dune', 1976, 5),
  ('God Emperor of Dune', 1981, 5),
  ('Heretics of Dune', 1984, 5),
  ('Chapterhouse: Dune', 1985, 5),

  -- Tolkien
  ('The Hobbit', 1937, 6),
  ('The Fellowship of the Ring', 1954, 6),
  ('The Two Towers', 1954, 6),
  ('The Return of the King', 1955, 6),

  -- Michael Moorcock
  ('Elric of Melniboné', 1972, 7),
  ('The Sailor on the Seas of Fate', 1976, 7),
  ('The Weird of the White Wolf', 1977, 7),
  ('The Knight of the Swords', 1971, 7),
  ('The Queen of the Swords', 1971, 7),
  ('The King of the Swords', 1971, 7),
  ('The Jewel in the Skull', 1967, 7),
  ('The Mad God''s Amulet', 1968, 7);
