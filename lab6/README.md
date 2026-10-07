# Лабораторная работа №6

Дисциплина: Проектирование и применение NoSQL-технологий

Тема: Моделирование таблиц Cassandra от запросов

Вариант 3 - Библиотека (читатель, книга, выдача, категория)

## Цель

Научиться проектировать таблицы Cassandra от запросов: выбирать partition key и clustering columns, создавать таблицы в CQL и проверять что запросы работают без сканирования всей таблицы.

## Предметная область

Библиотека с двумя филиалами (almaly и central). Читатели берут книги, библиотекарь оформляет выдачу и возврат. Основная сущность - выдача (loan): кто, какую книгу, когда взял, когда должен вернуть, вернул или нет.

Пользователи: читатель (смотрит свои выдачи), библиотекарь (оформляет выдачи, ищет должников, смотрит историю книги).

Запуск: добавил cassandra:5.0 в docker-compose.yml, порт только на 127.0.0.1.
```
docker compose up -d cassandra
docker exec -it nosql-cassandra-1 cqlsh
```
release_version 5.0.9

Все команды в queries.cql, выполнял через `cqlsh -f`.

## Запросы

| | Запрос | Известно на входе | Partition key | Clustering columns | Таблица |
|---|---|---|---|---|---|
| Q1 | выдачи читателя, новые сверху | reader_id | reader_id | loan_date DESC, loan_id | loans_by_reader |
| Q2 | кто должен вернуть книги до даты | месяц, дата | due_month | due_date ASC, loan_id | loans_by_due |
| Q3 | история книги | book_id | book_id | loan_date DESC, loan_id | loans_by_book |
| Q4 | выдачи читателя за период | reader_id, две даты | reader_id | loan_date DESC, loan_id | loans_by_reader |
| Q5 | активные выдачи филиала | branch | branch | due_date ASC, loan_id | active_loans |

Чтение - Q1 и Q5 самые частые (читатель открывает свой кабинет, библиотекарь смотрит кто что держит). Q2 раз в день для рассылки напоминаний. Q3 редко. Запись - каждая выдача и возврат, средняя частота.

Почему такие ключи:
- reader_id - у каждого читателя 10-30 выдач в год, партиции маленькие и их много, нагрузка размазана
- book_id - история одного экземпляра тоже короткая
- due_month - если взять partition key = due_date, то нельзя сделать диапазон "все до 10 октября", потому что диапазон по partition key не работает. Поэтому партиция - месяц, а внутри сортировка по дате
- branch - активных выдач в филиале ограниченное число (вернул - строка удаляется), партиция не растет бесконечно
- loan_id в конце ключа везде, чтобы два занятия с одной датой не перезаписали друг друга

## Таблицы

```
CREATE KEYSPACE IF NOT EXISTS lab6
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
USE lab6;

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
```

Одна и та же выдача лежит в 3-4 таблицах, это специально. Название книги и имя читателя тоже дублируются, чтобы не делать второй запрос.

## Данные

13 выдач, 5 читателей, 9 книг, период август - октябрь 2026. Всего 45 строк: 13 в loans_by_reader, 13 в loans_by_book, 12 в loans_by_due, 7 в active_loans.

Новая выдача пишется во все таблицы одним батчем:
```
BEGIN BATCH
  INSERT INTO loans_by_reader (reader_id, loan_date, loan_id, book_id, title, due_date, return_date, status) VALUES (1001, '2026-10-03', 'L04', 301, 'Мастер и Маргарита', '2026-10-17', null, 'active');
  INSERT INTO loans_by_book (book_id, loan_date, loan_id, reader_id, reader_name, due_date, return_date, status) VALUES (301, '2026-10-03', 'L04', 1001, 'Айдар С.', '2026-10-17', null, 'active');
  INSERT INTO loans_by_due (due_month, due_date, loan_id, reader_id, reader_name, book_id, title, status) VALUES ('2026-10', '2026-10-17', 'L04', 1001, 'Айдар С.', 301, 'Мастер и Маргарита', 'active');
  INSERT INTO active_loans (branch, due_date, loan_id, reader_id, reader_name, book_id, title) VALUES ('almaly', '2026-10-17', 'L04', 1001, 'Айдар С.', 301, 'Мастер и Маргарита');
APPLY BATCH;
```
Остальные INSERT в queries.cql.

## Q1 - выдачи читателя

```
SELECT loan_date, loan_id, title, due_date, status FROM loans_by_reader WHERE reader_id = 1001;
```
```
 loan_date  | loan_id | title              | due_date   | status
------------+---------+--------------------+------------+----------
 2026-10-03 |     L04 | Мастер и Маргарита | 2026-10-17 |   active
 2026-09-28 |     L03 |     Изучаем Python | 2026-10-12 |   active
 2026-09-10 |     L02 |  Грокаем алгоритмы | 2026-09-24 | returned
 2026-09-01 |     L01 |         Чистый код | 2026-09-15 | returned
```
Новые сверху, потому что CLUSTERING ORDER BY loan_date DESC.

## Q2 - кто должен вернуть до 10 октября

```
SELECT due_date, loan_id, reader_name, title, status FROM loans_by_due WHERE due_month = '2026-10' AND due_date <= '2026-10-10';
```
```
 due_date   | loan_id | reader_name | title             | status
------------+---------+-------------+-------------------+--------
 2026-10-04 |     L06 |     Дана Н. |         Абай жолы | active
 2026-10-08 |     L07 |     Алия К. | Грокаем алгоритмы | active
```
Равенство по partition key и диапазон по первой clustering column.

## Q3 - история книги

```
SELECT loan_date, loan_id, reader_name, return_date, status FROM loans_by_book WHERE book_id = 304;
```
```
 loan_date  | loan_id | reader_name | return_date | status
------------+---------+-------------+-------------+----------
 2026-09-24 |     L07 |     Алия К. |        null |   active
 2026-09-10 |     L02 |    Айдар С. |  2026-09-22 | returned
```

## Q4 - выдачи читателя за сентябрь

```
SELECT loan_date, loan_id, title, status FROM loans_by_reader WHERE reader_id = 1002 AND loan_date >= '2026-09-01' AND loan_date <= '2026-09-30';
```
```
 loan_date  | loan_id | title                             | status
------------+---------+-----------------------------------+----------
 2026-09-20 |     L06 |                         Абай жолы |   active
 2026-09-05 |     L05 | Гарри Поттер и философский камень | returned
```
Августовская выдача L13 не попала, диапазон сработал.

## Q5 - активные выдачи филиала

```
SELECT due_date, loan_id, reader_name, title FROM active_loans WHERE branch = 'almaly';
```
```
 due_date   | loan_id | reader_name | title
------------+---------+-------------+--------------------
 2026-10-08 |     L07 |     Алия К. |  Грокаем алгоритмы
 2026-10-12 |     L03 |    Айдар С. |     Изучаем Python
 2026-10-15 |     L08 |     Алия К. |               1984
 2026-10-17 |     L04 |    Айдар С. | Мастер и Маргарита
```
Отсортировано по сроку возврата, ближайшие сверху.

Еще последние 2 выдачи читателя:
```
SELECT loan_date, loan_id, title FROM loans_by_reader WHERE reader_id = 1001 LIMIT 2;
```
L04 и L03.

## Аналитика

Просроченные выдачи в филиале central на 7 октября:
```
SELECT due_date, loan_id, reader_name, title FROM active_loans WHERE branch = 'central' AND due_date < '2026-10-07';
```
```
 due_date   | loan_id | reader_name | title
------------+---------+-------------+-----------
 2026-10-04 |     L06 |     Дана Н. | Абай жолы
```

Сколько книг на руках по филиалам:
```
SELECT COUNT(*) FROM active_loans WHERE branch = 'almaly';
SELECT COUNT(*) FROM active_loans WHERE branch = 'central';
```
almaly 4, central 3. COUNT тут нормальный, потому что считает внутри одной партиции.

## UPDATE и DELETE - возврат книги

Алия вернула «Грокаем алгоритмы» (L07). Сначала смотрю строку по полному ключу:
```
SELECT * FROM loans_by_reader WHERE reader_id = 1004 AND loan_date = '2026-09-24' AND loan_id = 'L07';
```
Нашлась одна строка, status active. Обновляю историю во всех таблицах:
```
UPDATE loans_by_reader SET status = 'returned', return_date = '2026-10-07' WHERE reader_id = 1004 AND loan_date = '2026-09-24' AND loan_id = 'L07';
UPDATE loans_by_book SET status = 'returned', return_date = '2026-10-07' WHERE book_id = 304 AND loan_date = '2026-09-24' AND loan_id = 'L07';
UPDATE loans_by_due SET status = 'returned' WHERE due_month = '2026-10' AND due_date = '2026-10-08' AND loan_id = 'L07';
```
Из активных выдач строку удаляю, тоже по полному ключу:
```
SELECT * FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
DELETE FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
SELECT * FROM active_loans WHERE branch = 'almaly' AND due_date = '2026-10-08' AND loan_id = 'L07';
```
До DELETE 1 строка, после 0 rows.

Проверка:
```
SELECT loan_date, loan_id, title, return_date, status FROM loans_by_reader WHERE reader_id = 1004;
```
```
 loan_date  | loan_id | title             | return_date | status
------------+---------+-------------------+-------------+----------
 2026-10-01 |     L08 |              1984 |        null |   active
 2026-09-24 |     L07 | Грокаем алгоритмы |  2026-10-07 | returned
```
В active_loans для almaly осталось 3 строки.

## Запрос без partition key

Для проверки попробовал найти все активные выдачи через loans_by_reader:
```
SELECT * FROM loans_by_reader WHERE status = 'active';
```
```
InvalidRequest: Error from server: code=2200 [Invalid query] message="Cannot execute this query as it might involve data filtering and thus may have unpredictable performance. If you want to execute this query despite the performance unpredictability, use ALLOW FILTERING"
```
Cassandra не дает сканировать всю таблицу. Для этого запроса и нужна отдельная таблица active_loans.

## Анализ партиций

Сейчас в партиции читателя 2-4 строки, в партиции книги 1-2, в партиции месяца 6, в партиции филиала 3-4.

| Таблица | Партиция | сейчас | x10 | x100 | Риск |
|---|---|---|---|---|---|
| loans_by_reader | читатель | 4 | ~40 | ~400 | нет, активный читатель берет 20-30 книг в год, за 10 лет это 300 строк |
| loans_by_book | книга | 2 | ~20 | ~200 | нет, экземпляр выдается не чаще пары раз в месяц |
| loans_by_due | месяц | 6 | 60 | 600 | есть. Это все выдачи библиотеки за месяц, при 100 филиалах будет десятки тысяч строк в одной партиции |
| active_loans | филиал | 4 | 40 | 400 | hot partition: все библиотекари филиала читают одну партицию, но она не растет, строки удаляются при возврате |

Размер истории активного читателя (повышенная задача): 30 выдач в год, 10 лет - 300 строк по ~100 байт, это 30 КБ. Партиция до 100 МБ считается нормальной, так что бакет по году тут не нужен.

Самая опасная - loans_by_due. Если библиотека вырастет, партицию надо резать дальше: partition key (branch, due_month) или (due_date) с запросом по дням. Второй вариант: приложение делает несколько запросов, по одному на день, зато партиции маленькие и ровные.

Для active_loans при росте в 100 раз можно добавить в partition key бакет по дню срока возврата: ((branch, due_week), due_date, loan_id).

## Денормализация

В реляционной базе была бы одна таблица loans и индексы по reader_id, book_id, due_date, status. Тут четыре таблицы с одними и теми же данными. Плюс: каждый запрос читает одну партицию, нет джойнов и сканов. Минус: приложение само отвечает за то, чтобы записать выдачу во все таблицы (поэтому батч), и при возврате тоже надо обновить три таблицы и удалить из четвертой. Если где-то забыть, данные разойдутся.

## Контрольные вопросы

1. Сначала пишем какие запросы будут, потом под каждый делаем таблицу, а не наоборот
2. Partition key определяет на каком узле лежит строка и какие строки лежат вместе. Запрос всегда начинается с него
3. Partition key выбирает партицию, clustering column задает порядок строк внутри нее и позволяет делать диапазоны
4. PRIMARY KEY ((partition), clustering1, clustering2)
5. Потому что тогда надо сканировать все партиции на всех узлах, Cassandra это запрещает без ALLOW FILTERING
6. Запись дешевая, место дешевое, а чтение должно быть одной партицией. Поэтому проще хранить копии под каждый запрос
7. Диапазон можно делать только по первой clustering column, по которой еще не было равенства, и в том порядке как они объявлены
8. Партиция, в которую идет слишком много запросов или записей. Нагружает один узел, остальные простаивают
9. Когда партиция растет без ограничения во времени - логи, события, телеметрия. Добавляем в partition key месяц или день
10. Потому что каждая таблица обслуживает свой запрос, и для Cassandra это нормально

## Вывод

В этой лабе я спроектировал модель выдач библиотеки для Cassandra от запросов, а не от сущностей. Получилось четыре таблицы под пять запросов: по читателю, по книге, по сроку возврата и по активным выдачам филиала, и в каждой запрос идет по partition key и использует clustering columns для сортировки и диапазона. Одна выдача лежит сразу в четырех таблицах, это и есть денормализация, за нее платим батчем при записи и обновлением нескольких таблиц при возврате. Проверил UPDATE и DELETE по полному ключу и убедился, что без partition key Cassandra запрос не выполняет. Оценил рост партиций: читатель и книга растут медленно, а партиция месяца в loans_by_due при большой библиотеке станет проблемой, ее надо делить по филиалу или по дню. Главное отличие от реляционной модели - нет универсальной таблицы и индексов, под каждый запрос своя таблица.
