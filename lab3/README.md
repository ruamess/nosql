# Лабораторная работа №3

Дисциплина: Нереляционные базы данных (NoSQL)

Тема: Выполнение операций Insert, Find, Update и Delete в MongoDB

Вариант 3 - Библиотека (libraryDB, books)

## Цель

Освоить полный цикл CRUD в MongoDB: создание, чтение, изменение и удаление документов; работу с BSON-типами, вложенными документами, массивами, фильтрацией, проекцией и сортировкой.

## Предметная область

Каталог книг в библиотеке. У книги есть название, автор, год, страницы, рейтинг, кол-во экземпляров, доступна или нет, издательство (вложенный документ) и жанры (массив).

Все команды лежат в queries.js, база после выполнения в libraryDB.books.json (импорт через `mongoimport --db libraryDB --collection books --jsonArray --file libraryDB.books.json`).

## 4. База и коллекция

```
use libraryDB
db.createCollection("books")
show collections
```

## 5. insertOne

```
db.books.insertOne({
  bookId: 301,
  title: "Мастер и Маргарита",
  author: "Михаил Булгаков",
  language: "ru",
  year: 2015,
  pages: 480,
  rating: 4.8,
  copies: 4,
  available: true,
  addedAt: ISODate("2024-09-12"),
  publisher: { name: "АСТ", city: "Москва" },
  genres: ["роман", "классика", "мистика"]
})
```

## 6. insertMany

Добавил еще 14 книг (302-315), весь список в queries.js

```
db.books.insertMany([
  { bookId: 302, title: "Преступление и наказание", author: "Фёдор Достоевский", language: "ru",
    year: 2021, pages: 608, rating: 4.6, copies: 3, available: true, addedAt: ISODate("2024-09-12"),
    publisher: { name: "Эксмо", city: "Москва" }, genres: ["роман", "классика"] },
  ...
])
db.books.countDocuments()
```
15

## 7. find и findOne

```
db.books.find()
db.books.findOne({ bookId: 305 })
db.books.findOne({ author: "Роберт Мартин" })
```
find вывел все 15, первый findOne нашел Абай жолы, второй Чистый код

## 8. Фильтрация

```
db.books.find({ language: "kk" })
db.books.find({ year: 2019 })
db.books.find({ available: false })
```
1) Абай жолы
2) Чистый код, Кочевники
3) Turbo Pascal 7.0, Самоучитель работы на компьютере

```
db.books.find({ rating: { $gt: 4.7 } })
db.books.find({ pages: { $gte: 700 } })
db.books.find({ year: { $lt: 2010 } })
db.books.find({ pages: { $gte: 300, $lte: 450 } })
db.books.find({ "publisher.city": { $ne: "Москва" } })
```
1) Мастер и Маргарита, Абай жолы, Гарри Поттер
2) Абай жолы, Кочевники, Совершенный код, Атлант расправил плечи
3) Turbo Pascal 7.0, Самоучитель
4) Гарри Поттер, Три товарища, 1984
5) 6 книг (Питер и Жазушы)

## 9. Несколько условий

```
db.books.find({ available: true, rating: { $gte: 4.7 } })
db.books.find({ year: { $gte: 2019 }, pages: { $lt: 500 } })
db.books.find({ $or: [{ year: { $lt: 2010 } }, { rating: { $gte: 4.8 } }] })
```
1) 6 книг: Мастер и Маргарита, Чистый код, Абай жолы, Кочевники, Гарри Поттер, Три товарища
2) Чистый код, Грокаем алгоритмы, 1984
3) 5 книг: три с рейтингом от 4.8 и две старые (2003 и 2005 год)

## 10. Вложенные документы

```
db.books.find({ "publisher.city": "Алматы" })
db.books.find({ "publisher.name": "Питер" })
```
1) Абай жолы, Кочевники
2) Чистый код, Грокаем алгоритмы, Изучаем Python, Самоучитель

## 11. Массивы

```
db.books.find({ genres: "классика" })
db.books.find({ genres: { $all: ["программирование", "учебная"] } })
```
1) 5 книг
2) 5 книг (Чистый код, Грокаем алгоритмы, Совершенный код, Изучаем Python, Turbo Pascal)

## 12. Проекция

```
db.books.find({}, { _id: 0, title: 1, author: 1 })
db.books.find({ genres: "роман" }, { _id: 0, title: 1, year: 1, rating: 1 })
```
Выводятся только указанные поля, например `{ title: 'Кочевники', year: 2019, rating: 4.7 }`

## 13. Сортировка и limit

```
db.books.find().sort({ year: 1 })
db.books.find().sort({ pages: -1 })
db.books.find().sort({ rating: -1 }).limit(3)
```
Топ 3 по рейтингу: Абай жолы (4.9), Гарри Поттер (4.8), Мастер и Маргарита (4.8)

## 14. updateOne

```
db.books.updateOne({ bookId: 303 }, { $set: { rating: 4.8, copies: 3 } })
db.books.findOne({ bookId: 303 })
```
modifiedCount: 1, рейтинг был 4.7 стал 4.8, экземпляров было 2 стало 3

## 15. updateMany

```
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { shelf: "IT-2" } })
```
modifiedCount: 4

## 16. $inc

```
db.books.updateOne({ bookId: 304 }, { $inc: { copies: 2 } })
```
copies 5 -> 7

## 17. $push

```
db.books.updateOne({ bookId: 313 }, { $push: { genres: "фантастика" } })
```
в жанры 1984 добавилась фантастика

## 18. deleteOne

```
db.books.findOne({ bookId: 312 })
db.books.deleteOne({ bookId: 312 })
db.books.findOne({ bookId: 312 })
```
deletedCount: 1, после удаления findOne возвращает null

## 19. deleteMany

```
db.books.find({ available: false })
db.books.deleteMany({ available: false })
```
find показал 2 книги (314 и 315), deletedCount: 2

## 20. Итоговая проверка

```
db.books.find()
db.books.countDocuments()
```
Осталось 12 документов из 15. Удалились 312, 314, 315. У 303 поменялся рейтинг и copies, у книг Питера появилось поле shelf, у 304 стало 7 экземпляров, у 313 новый жанр.

## 22. Дополнительное задание

```
db.books.find(
  { "publisher.city": "Москва", rating: { $gte: 4.5 } },
  { _id: 0, title: 1, author: 1, rating: 1 }
).sort({ rating: -1 }).limit(3)
```
```
{ title: 'Мастер и Маргарита', author: 'Михаил Булгаков', rating: 4.8 }
{ title: 'Гарри Поттер и философский камень', author: 'Джоан Роулинг', rating: 4.8 }
{ title: 'Три товарища', author: 'Эрих Мария Ремарк', rating: 4.7 }
```

## 23. Мини-сценарий

```
db.books.insertOne({
  bookId: 316, title: "Дюна", author: "Фрэнк Герберт", language: "ru",
  year: 2020, pages: 704, rating: 4.7, copies: 2, available: true, addedAt: ISODate("2026-09-28"),
  publisher: { name: "АСТ", city: "Москва" }, genres: ["фантастика", "роман"]
})
db.books.findOne({ bookId: 316 })
db.books.updateOne({ bookId: 316 }, { $set: { available: false }, $inc: { copies: -1 } })
db.books.findOne({ bookId: 316 })
db.books.deleteOne({ bookId: 316 })
db.books.findOne({ bookId: 316 })
```

1. insertOne - добавили новую книгу
2. findOne - проверили что она есть
3. updateOne - один экземпляр потеряли, книгу пока не выдаем
4. findOne - copies стало 1, available false
5. deleteOne - книгу списали
6. findOne - null, книги больше нет

## Вывод

В этой лабе я сделал все CRUD операции в MongoDB на примере каталога книг. Добавлял документы через insertOne и insertMany, искал через find и findOne с разными фильтрами ($gt, $gte, $lt, $lte, $ne, $or). Попробовал запросы к вложенному документу через точку и поиск по массиву, в том числе $all. Сделал проекцию, сортировку и limit. Обновлял документы через $set, $inc и $push, удалял через deleteOne и deleteMany. Перед deleteMany лучше сначала сделать find с тем же условием, чтобы не удалить лишнее. В итоге в коллекции осталось 12 книг.
