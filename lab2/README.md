# Лабораторная работа №2

Дисциплина: Нереляционные базы данных (NoSQL)

Тема: Моделирование данных в MongoDB: Embedded Documents, массивы и References

Вариант: 3 — Библиотека (books с publisher и authors, связь с readers)

Инструменты: MongoDB 8.0.4 в Docker, mongosh, mongoexport.

## Цель работы

Освоить проектирование документной базы MongoDB: вложенные документы, массивы, Embedding, Referencing, связи между сущностями и запросы к вложенным данным.

## Файлы

- `queries.js` — команды по заданиям 2–8 и $lookup
- `library_db.books.json`, `library_db.readers.json`, `library_db.publishers.json` — экспорт коллекций после выполнения всех заданий

Восстановить базу:

```
mongoimport --db library_db --collection books --jsonArray --file library_db.books.json
mongoimport --db library_db --collection readers --jsonArray --file library_db.readers.json
mongoimport --db library_db --collection publishers --jsonArray --file library_db.publishers.json
```

## Предметная область

Городская библиотека. Есть книги, читатели и издательства. У книги есть название, ISBN, год, жанр, число страниц, цена, количество экземпляров, издательство, список авторов и отзывы читателей. Читатель имеет читательский билет, контакты и любимые жанры. Издательство — название, город, год основания, сайт.

## Задание 1. Проектирование модели

Сущности и связи:

```
publishers 1 ──── N books N ──── M readers
                    │
                    └── reviews (внутри книги)
```

- books — publishers: 1:N, у книги одно издательство, у издательства много книг
- books — readers: N:M, читатель берёт много книг, книгу берут много читателей
- books — reviews: 1:N, отзыв существует только внутри книги
- books — authors: у книги один или несколько авторов

Что встроил, что вынес:

- `publisher` встроен в книгу как вложенный документ. Издательство читается всегда вместе с книгой (карточка книги), полей у него мало и они почти не меняются. Для сравнения в задании 8 сделал ещё и отдельную коллекцию `publishers` со ссылкой `publisherId`.
- `authors` — массив строк внутри книги. Авторов у книги 1–4, отдельной сущности с атрибутами по заданию не нужно.
- `reviews` — массив вложенных документов внутри книги. Отзыв без книги не имеет смысла, а на страницу книги отзывы выводятся вместе с ней.
- `readers` — отдельная коллекция. У читателя свои поля (билет, контакты, жанры), он существует независимо от книги, и связь N:M встраивать нельзя — данные дублировались бы в каждой книге. Связь через массив `readerIds` в книге.

## Задание 2. Создание базы и коллекций

```
use library_db
db.createCollection("books")
db.createCollection("readers")
db.createCollection("publishers")
show collections
```

```
[ 'publishers', 'books', 'readers' ]
```

## Задание 3. Embedded Document

В books вставлено 13 книг, каждая с вложенным документом `publisher` и массивом `authors`. Пример одного документа:

```
db.books.insertOne({
  bookId: 303,
  title: "Чистый код. Создание, анализ и рефакторинг",
  isbn: "978-5-4461-0960-9",
  year: 2019,
  genre: "программирование",
  pages: 464,
  price: 5990,
  language: "ru",
  copies: 2,
  publisher: { name: "Питер", city: "Санкт-Петербург", founded: 1991 },
  authors: ["Роберт Мартин"]
})
```

Остальные книги в `library_db.books.json`: Мастер и Маргарита, Преступление и наказание, Грокаем алгоритмы, Путь Абая, Кочевники, Гарри Поттер и философский камень, Sapiens, Совершенный код, Три товарища, Изучаем Python, Атлант расправил плечи, Паттерны объектно-ориентированного проектирования.

## Задание 4. Массив документов

Добавил трём книгам массив отзывов `reviews`, каждый отзыв — вложенный документ с readerId, оценкой, текстом и датой.

```
db.books.updateOne(
  { bookId: 303 },
  { $set: { reviews: [
    { readerId: 1, rating: 5, text: "Обязательно к прочтению любому джуну", date: ISODate("2026-03-14") },
    { readerId: 4, rating: 4, text: "Примеры на Java, но идеи универсальные", date: ISODate("2026-06-02") }
  ]}}
)
```

Аналогично для bookId 301 (3 отзыва) и 304 (1 отзыв).

## Задание 5. Dot notation

Книги издательств из Алматы:
```
db.books.find({ "publisher.city": "Алматы" })
```
Путь Абая, Кочевники.

Книги издательства Питер:
```
db.books.find({ "publisher.name": "Питер" })
```
Чистый код, Грокаем алгоритмы, Изучаем Python, Паттерны ООП.

С дополнительным условием — московские издательства, книги от 2018 года:
```
db.books.find({ "publisher.city": "Москва", year: { $gte: 2018 } })
```
Преступление и наказание (2021), Атлант расправил плечи (2020).

По полю внутри массива документов — книги с оценкой 3 и ниже:
```
db.books.find({ "reviews.rating": { $lte: 3 } })
```
Мастер и Маргарита.

## Задание 6. Работа с массивами

Поиск по элементу массива:
```
db.books.find({ authors: "Роберт Мартин" })
```
Чистый код.

$all — книги, где среди авторов есть и Гамма, и Джонсон:
```
db.books.find({ authors: { $all: ["Эрих Гамма", "Ральф Джонсон"] } })
```
Паттерны объектно-ориентированного проектирования.

$push — у «Паттернов» было указано три автора из четырёх, добавил четвёртого:
```
db.books.updateOne({ bookId: 313 }, { $push: { authors: "Джон Влиссидес" } })
```
authors стал `["Эрих Гамма", "Ричард Хелм", "Ральф Джонсон", "Джон Влиссидес"]`.

## Задание 7. Referencing

Коллекция readers, 6 читателей. У каждого свой числовой `_id`, контакты вложенным документом и массив любимых жанров.

```
db.readers.insertMany([
  { _id: 1, name: "Айдар Сериков", phone: "+7 701 254 18 73", email: "aidar.serikov@gmail.com",
    cardNumber: "LB-2023-0412", registeredAt: ISODate("2023-02-14"),
    contact: { city: "Алматы", street: "Абая 52", apartment: 14 },
    favoriteGenres: ["программирование", "нон-фикшн"] },
  ...
])
```

Связь с книгами — массив `readerIds` в книге (кто сейчас держит книгу на руках):

```
db.books.updateOne({ bookId: 303 }, { $set: { readerIds: [1, 4] } })
db.books.updateOne({ bookId: 301 }, { $set: { readerIds: [2, 3, 5] } })
db.books.updateOne({ bookId: 304 }, { $set: { readerIds: [6] } })
db.books.updateOne({ bookId: 311 }, { $set: { readerIds: [4, 6] } })
db.books.updateOne({ bookId: 306 }, { $set: { readerIds: [5] } })
db.books.updateOne({ bookId: 307 }, { $set: { readerIds: [2] } })
```

Какие книги на руках у читателя 4:
```
db.books.find({ readerIds: 4 }, { _id: 0, title: 1, readerIds: 1 })
```
Чистый код, Изучаем Python.

Кто взял «Мастера и Маргариту» — сначала берём readerIds из книги, потом ищем читателей:
```
db.readers.find({ _id: { $in: db.books.findOne({ bookId: 301 }).readerIds } }, { _id: 0, name: 1 })
```
Дана Нурланова, Максим Петров, Иван Соколов.

## Задание 8. Embedding vs Referencing

Связь книга — издательство сделал двумя способами. Embedding — вложенный `publisher` в книге (с самого начала). Referencing — коллекция `publishers` и поле `publisherId` в книге:

```
db.publishers.insertMany([
  { _id: 1, name: "АСТ", city: "Москва", founded: 1990, website: "ast.ru" },
  { _id: 3, name: "Питер", city: "Санкт-Петербург", founded: 1991, website: "piter.com" },
  ...
])
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { publisherId: 3 } })
```

Чтение. С embedding один запрос:
```
db.books.find({ "publisher.city": "Санкт-Петербург" }, { _id: 0, title: 1, "publisher.name": 1 })
```
С referencing два — сначала id издательства, потом книги (или $lookup):
```
db.publishers.find({ city: "Санкт-Петербург" }, { _id: 1 })
db.books.find({ publisherId: 3 }, { _id: 0, title: 1, publisherId: 1 })
```
Результат одинаковый — 4 книги Питера.

Обновление. Если издательство переехало, с embedding надо обновить все его книги, с referencing — один документ:
```
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { "publisher.city": "Санкт-Петербург" } })
db.publishers.updateOne({ _id: 3 }, { $set: { city: "Санкт-Петербург" } })
```

Сравнение:

| | Embedding | Referencing |
|---|---|---|
| Дублирование | название и город издательства повторяются в каждой книге (у Питера 4 раза) | издательство хранится один раз |
| Чтение | один запрос, всё в документе | два запроса или $lookup |
| Обновление | updateMany по всем книгам, можно забыть часть | updateOne одного документа |
| Рост документа | книга чуть больше, но издательство маленькое и не растёт | книга меньше на одно поле |
| Сложность | одна коллекция | две коллекции и нужно следить за целостностью ссылок |

Для библиотеки я бы оставил embedding: издательств мало, полей у них 3–4, меняются они почти никогда, а карточка книги нужна одним запросом. Referencing оправдан, если у издательства появится много атрибутов или его будут часто редактировать.

## $lookup

Читатели, у которых на руках «Мастер и Маргарита»:

```
db.books.aggregate([
  { $match: { bookId: 301 } },
  { $lookup: { from: "readers", localField: "readerIds", foreignField: "_id", as: "readerInfo" } },
  { $project: { _id: 0, title: 1, "readerInfo.name": 1, "readerInfo.contact.city": 1 } }
])
```

```
{
  title: 'Мастер и Маргарита',
  readerInfo: [
    { name: 'Максим Петров', contact: { city: 'Москва' } },
    { name: 'Дана Нурланова', contact: { city: 'Астана' } },
    { name: 'Иван Соколов', contact: { city: 'Санкт-Петербург' } }
  ]
}
```

Все книги с данными издательства из коллекции publishers:

```
db.books.aggregate([
  { $lookup: { from: "publishers", localField: "publisherId", foreignField: "_id", as: "publisherInfo" } },
  { $project: { _id: 0, title: 1, "publisherInfo.name": 1, "publisherInfo.website": 1 } }
])
```

Параметры $lookup:
- `from` — из какой коллекции подтягиваем документы (readers)
- `localField` — поле в текущей коллекции, по которому связываем (readerIds в books)
- `foreignField` — поле в коллекции from, с которым сравнивается localField (_id в readers)
- `as` — имя массива, куда попадут найденные документы (readerInfo)

Если localField — массив, $lookup подставляет все документы, чей foreignField есть в этом массиве.

## Вывод

В работе спроектирована база библиотеки из трёх сущностей: книги, читатели и издательства. Издательство и отзывы встроены в документ книги, так как читаются вместе с ней и не растут бесконтрольно, а читатели вынесены в отдельную коллекцию из-за связи N:M. Использовал dot notation для запросов к вложенному документу publisher и к полям внутри массива reviews, а для массива authors — поиск по элементу, $all и $push. Связь книга — издательство реализовал двумя способами и сравнил: embedding проще читать, referencing проще обновлять и не дублирует данные. Через $lookup объединил книги с читателями и издательствами в одном aggregate-запросе. Главный вывод: модель в MongoDB выбирается под запросы приложения, а не по правилам нормализации.
