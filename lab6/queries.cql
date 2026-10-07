CREATE KEYSPACE IF NOT EXISTS lab6
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE lab6;

-- Q1, Q4: выдачи читателя, выдачи читателя за период
CREATE TABLE loans_by_reader (
  reader_id int,
  loan_date date,
  loan_id text,
  book_id int,
  title text,
  due_date date,
  return_date date,
  status text,
  PRIMARY KEY ((reader_id), loan_date, loan_id)
) WITH CLUSTERING ORDER BY (loan_date DESC, loan_id ASC);

-- Q3: история книги
CREATE TABLE loans_by_book (
  book_id int,
  loan_date date,
  loan_id text,
  reader_id int,
  reader_name text,
  due_date date,
  return_date date,
  status text,
  PRIMARY KEY ((book_id), loan_date, loan_id)
) WITH CLUSTERING ORDER BY (loan_date DESC, loan_id ASC);

-- Q2: выдачи по сроку возврата
CREATE TABLE loans_by_due (
  due_month text,
  due_date date,
  loan_id text,
  reader_id int,
  reader_name text,
  book_id int,
  title text,
  status text,
  PRIMARY KEY ((due_month), due_date, loan_id)
) WITH CLUSTERING ORDER BY (due_date ASC, loan_id ASC);

-- Q5: активные выдачи филиала
CREATE TABLE active_loans (
  branch text,
  due_date date,
  loan_id text,
  reader_id int,
  reader_name text,
  book_id int,
  title text,
  PRIMARY KEY ((branch), due_date, loan_id)
) WITH CLUSTERING ORDER BY (due_date ASC, loan_id ASC);

-- одна выдача пишется сразу во все таблицы
BEGIN BATCH
  INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1001, '2026-10-03', 'L04', 301, 'Мастер и Маргарита', '2026-10-17', null, 'active');
  INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (301, '2026-10-03', 'L04', 1001, 'Айдар С.', '2026-10-17', null, 'active');
  INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-17', 'L04', 1001, 'Айдар С.', 301, 'Мастер и Маргарита', 'active');
  INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('almaly', '2026-10-17', 'L04', 1001, 'Айдар С.', 301, 'Мастер и Маргарита');
APPLY BATCH;

-- loans_by_reader
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1001, '2026-09-01', 'L01', 303, 'Чистый код', '2026-09-15', '2026-09-14', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1001, '2026-09-10', 'L02', 304, 'Грокаем алгоритмы', '2026-09-24', '2026-09-22', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1001, '2026-09-28', 'L03', 311, 'Изучаем Python', '2026-10-12', null, 'active');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1002, '2026-08-20', 'L13', 301, 'Мастер и Маргарита', '2026-09-03', '2026-09-01', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1002, '2026-09-05', 'L05', 307, 'Гарри Поттер и философский камень', '2026-09-19', '2026-09-19', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1002, '2026-09-20', 'L06', 305, 'Абай жолы', '2026-10-04', null, 'active');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1004, '2026-09-24', 'L07', 304, 'Грокаем алгоритмы', '2026-10-08', null, 'active');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1004, '2026-10-01', 'L08', 313, '1984', '2026-10-15', null, 'active');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1005, '2026-09-12', 'L09', 308, 'Sapiens', '2026-09-26', '2026-09-25', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1005, '2026-09-30', 'L10', 306, 'Кочевники', '2026-10-14', null, 'active');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1008, '2026-09-02', 'L11', 311, 'Изучаем Python', '2026-09-16', '2026-09-16', 'returned');
INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1008, '2026-10-05', 'L12', 303, 'Чистый код', '2026-10-19', null, 'active');

-- loans_by_book
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (303, '2026-09-01', 'L01', 1001, 'Айдар С.', '2026-09-15', '2026-09-14', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (304, '2026-09-10', 'L02', 1001, 'Айдар С.', '2026-09-24', '2026-09-22', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (311, '2026-09-28', 'L03', 1001, 'Айдар С.', '2026-10-12', null, 'active');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (301, '2026-08-20', 'L13', 1002, 'Дана Н.', '2026-09-03', '2026-09-01', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (307, '2026-09-05', 'L05', 1002, 'Дана Н.', '2026-09-19', '2026-09-19', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (305, '2026-09-20', 'L06', 1002, 'Дана Н.', '2026-10-04', null, 'active');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (304, '2026-09-24', 'L07', 1004, 'Алия К.', '2026-10-08', null, 'active');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (313, '2026-10-01', 'L08', 1004, 'Алия К.', '2026-10-15', null, 'active');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (308, '2026-09-12', 'L09', 1005, 'Иван С.', '2026-09-26', '2026-09-25', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (306, '2026-09-30', 'L10', 1005, 'Иван С.', '2026-10-14', null, 'active');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (311, '2026-09-02', 'L11', 1008, 'Мадина Т.', '2026-09-16', '2026-09-16', 'returned');
INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (303, '2026-10-05', 'L12', 1008, 'Мадина Т.', '2026-10-19', null, 'active');

-- loans_by_due
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-03', 'L13', 1002, 'Дана Н.', 301, 'Мастер и Маргарита', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-15', 'L01', 1001, 'Айдар С.', 303, 'Чистый код', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-16', 'L11', 1008, 'Мадина Т.', 311, 'Изучаем Python', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-19', 'L05', 1002, 'Дана Н.', 307, 'Гарри Поттер и философский камень', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-24', 'L02', 1001, 'Айдар С.', 304, 'Грокаем алгоритмы', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-09', '2026-09-26', 'L09', 1005, 'Иван С.', 308, 'Sapiens', 'returned');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-04', 'L06', 1002, 'Дана Н.', 305, 'Абай жолы', 'active');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-08', 'L07', 1004, 'Алия К.', 304, 'Грокаем алгоритмы', 'active');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-12', 'L03', 1001, 'Айдар С.', 311, 'Изучаем Python', 'active');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-14', 'L10', 1005, 'Иван С.', 306, 'Кочевники', 'active');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-15', 'L08', 1004, 'Алия К.', 313, '1984', 'active');
INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-19', 'L12', 1008, 'Мадина Т.', 303, 'Чистый код', 'active');

-- active_loans
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('almaly', '2026-10-08', 'L07', 1004, 'Алия К.', 304, 'Грокаем алгоритмы');
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('almaly', '2026-10-12', 'L03', 1001, 'Айдар С.', 311, 'Изучаем Python');
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('almaly', '2026-10-15', 'L08', 1004, 'Алия К.', 313, '1984');
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('central', '2026-10-04', 'L06', 1002, 'Дана Н.', 305, 'Абай жолы');
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('central', '2026-10-14', 'L10', 1005, 'Иван С.', 306, 'Кочевники');
INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('central', '2026-10-19', 'L12', 1008, 'Мадина Т.', 303, 'Чистый код');

-- Q1 выдачи читателя
SELECT loan_date, loan_id, title, due_date, status FROM loans_by_reader WHERE reader_id = 1001;

-- Q2 кто должен вернуть книги до 10 октября
SELECT due_date, loan_id, reader_name, title, status FROM loans_by_due WHERE due_month = '2026-10' AND due_date <= '2026-10-10';

-- Q3 история книги
SELECT loan_date, loan_id, reader_name, return_date, status FROM loans_by_book WHERE book_id = 304;

-- Q4 выдачи читателя за сентябрь
SELECT loan_date, loan_id, title, status FROM loans_by_reader WHERE reader_id = 1002 AND loan_date >= '2026-09-01' AND loan_date <= '2026-09-30';

-- Q5 активные выдачи филиала
SELECT due_date, loan_id, reader_name, title FROM active_loans WHERE branch = 'almaly';

-- последние 2 выдачи читателя
SELECT loan_date, loan_id, title FROM loans_by_reader WHERE reader_id = 1001 LIMIT 2;

-- аналитика: просроченные выдачи и сколько книг на руках в каждом филиале
SELECT due_date, loan_id, reader_name, title FROM active_loans WHERE branch = 'central' AND due_date < '2026-10-07';
SELECT COUNT(*) FROM active_loans WHERE branch = 'almaly';
SELECT COUNT(*) FROM active_loans WHERE branch = 'central';

-- возврат книги L07: обновляем историю и убираем из активных
SELECT * FROM loans_by_reader WHERE reader_id = 1004 AND loan_date = '2026-09-24' AND loan_id = 'L07';
UPDATE loans_by_reader SET status = 'returned', return_date = '2026-10-07' WHERE reader_id = 1004 AND loan_date = '2026-09-24' AND loan_id = 'L07';
UPDATE loans_by_book SET status = 'returned', return_date = '2026-10-07' WHERE book_id = 304 AND loan_date = '2026-09-24' AND loan_id = 'L07';
UPDATE loans_by_due SET status = 'returned' WHERE due_month = '2026-10' AND due_date = '2026-10-08' AND loan_id = 'L07';
SELECT * FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
DELETE FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
SELECT * FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
SELECT loan_date, loan_id, title, return_date, status FROM loans_by_reader WHERE reader_id = 1004;
SELECT due_date, loan_id, reader_name, title FROM active_loans WHERE branch = 'almaly';

DESCRIBE TABLE loans_by_reader;
