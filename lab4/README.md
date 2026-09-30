# Лабораторная работа №4

Дисциплина: Проектирование и применение NoSQL-технологий

Тема: Агрегация данных, индексы и анализ производительности запросов MongoDB

Вариант 3 - Социальная сеть (основная коллекция posts, поля authorId, createdAt, likes, tags)

## Цель

Получить практические навыки построения Aggregation Pipeline, создания простых и составных индексов, анализа планов выполнения запросов с помощью explain() и оптимизации запросов MongoDB.

## Предметная область

Соцсеть. Пользователи пишут посты (текст, фото, видео, ссылки), у постов есть лайки, просмотры и теги. Другие пользователи оставляют комментарии.

База social_lab4, три коллекции:
- posts - посты, 32 документа
- users - пользователи, 8 документов
- comments - комментарии, 15 документов

Все команды в queries.js. Данные лежат в social_lab4.posts.json, social_lab4.users.json, social_lab4.comments.json, импорт через `mongoimport --db social_lab4 --collection posts --jsonArray --file social_lab4.posts.json` (так же для users и comments).

```
use social_lab4
db.createCollection("posts")
db.createCollection("users")
db.createCollection("comments")
```

Примеры документов:

```
// posts
{ postId: 1, authorId: 1003, type: "text",
  text: "Перевели прод на новый кластер k8s, простой 4 минуты вместо обещанных 30",
  likes: 184, views: 2310, tags: ["devops", "работа", "it"],
  createdAt: ISODate("2026-08-03T09:15:00Z") }

// users
{ userId: 1003, username: "maks_petrov", name: "Максим Петров", city: "Москва", followers: 2115 }

// comments
{ commentId: 6, postId: 4, userId: 1003, text: "Используем, но resume token надо хранить самим",
  createdAt: ISODate("2026-08-06T16:00:00Z") }
```

posts.authorId и comments.userId ссылаются на users.userId, comments.postId на posts.postId.

## Задание 1. $match

```
db.posts.aggregate([{ $match: { type: "video" } }])
db.posts.aggregate([{ $match: { likes: { $gte: 300, $lte: 500 } } }])
db.posts.aggregate([{ $match: { authorId: 1003, likes: { $gte: 200 } } }])
db.posts.aggregate([{ $match: { type: { $in: ["video", "link"] } } }])
```
1) 4 видео (посты 7, 17, 26, 32)
2) 6 постов с лайками от 300 до 500 (2, 7, 13, 17, 26, 32)
3) 3 поста автора 1003 (8, 21, 32)
4) 9 постов: 4 видео и 5 ссылок

## Задание 2. $project

```
db.posts.aggregate([
  { $match: { authorId: 1005 } },
  { $project: { _id: 0, postId: 1, type: 1, likes: 1, createdAt: 1 } }
])
```
```
{ postId: 3, type: 'link', likes: 530, createdAt: ISODate('2026-08-05T12:00:00.000Z') }
{ postId: 11, type: 'text', likes: 742, createdAt: ISODate('2026-08-17T08:00:00.000Z') }
{ postId: 17, type: 'video', likes: 465, createdAt: ISODate('2026-08-25T10:30:00.000Z') }
{ postId: 25, type: 'photo', likes: 618, createdAt: ISODate('2026-09-06T16:20:00.000Z') }
```

Вычисляемое поле - процент лайков от просмотров:
```
db.posts.aggregate([
  { $project: { _id: 0, postId: 1, likes: 1, views: 1,
      likeRate: { $round: [{ $multiply: [{ $divide: ["$likes", "$views"] }, 100] }, 1] } } }
])
```
```
{ postId: 1, likes: 184, views: 2310, likeRate: 8 }
{ postId: 2, likes: 412, views: 5120, likeRate: 8 }
{ postId: 3, likes: 530, views: 9870, likeRate: 5.4 }
{ postId: 4, likes: 67, views: 1430, likeRate: 4.7 }
...
```

## Задание 3. $group

По авторам:
```
db.posts.aggregate([
  { $group: { _id: "$authorId", postCount: { $sum: 1 }, totalLikes: { $sum: "$likes" },
      avgLikes: { $avg: "$likes" }, minLikes: { $min: "$likes" }, maxLikes: { $max: "$likes" } } }
])
```

| authorId | postCount | totalLikes | avgLikes | minLikes | maxLikes |
|---|---|---|---|---|---|
| 1001 | 4 | 506 | 126.5 | 67 | 203 |
| 1002 | 4 | 1191 | 297.75 | 157 | 412 |
| 1003 | 6 | 1246 | 207.67 | 88 | 372 |
| 1004 | 3 | 291 | 97 | 62 | 134 |
| 1005 | 4 | 2355 | 588.75 | 465 | 742 |
| 1006 | 4 | 1375 | 343.75 | 167 | 521 |
| 1007 | 4 | 856 | 214 | 129 | 341 |
| 1008 | 3 | 152 | 50.67 | 31 | 73 |

По типу поста:
```
db.posts.aggregate([
  { $group: { _id: "$type", postCount: { $sum: 1 }, avgLikes: { $avg: "$likes" }, totalViews: { $sum: "$views" } } }
])
```
```
{ _id: 'link', postCount: 5, avgLikes: 279.2, totalViews: 25290 }
{ _id: 'photo', postCount: 11, avgLikes: 264.18, totalViews: 36710 }
{ _id: 'text', postCount: 12, avgLikes: 179.83, totalViews: 34760 }
{ _id: 'video', postCount: 4, avgLikes: 378, totalViews: 25440 }
```
Видео мало, но лайков в среднем больше всего.

## Задание 4. $sort и $limit

Топ 5 постов по лайкам:
```
db.posts.aggregate([
  { $match: { views: { $gt: 0 } } },
  { $sort: { likes: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, postId: 1, authorId: 1, likes: 1, text: 1 } }
])
```
```
{ postId: 11, authorId: 1005, likes: 742, text: 'Джуны, читайте код коллег. Это быстрее любого курса' }
{ postId: 25, authorId: 1005, likes: 618, text: 'Питер, крыши, сентябрь' }
{ postId: 3, authorId: 1005, likes: 530, text: 'Написал статью про то, как мы делили монолит. Ссылка внутри' }
{ postId: 22, authorId: 1006, likes: 521, text: 'Полумарафон в Астане, 1:52:40' }
{ postId: 17, authorId: 1005, likes: 465, text: 'Запись доклада с митапа про менторство' }
```
-1 это сортировка по убыванию (сначала самые залайканные), 1 было бы по возрастанию.

## Задание 5. $unwind

Самые частые теги:
```
db.posts.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 4 }
])
```
```
{ _id: 'it', count: 15 }
{ _id: 'работа', count: 10 }
{ _id: 'фото', count: 9 }
{ _id: 'учеба', count: 5 }
```
$unwind делает из одного поста с тремя тегами три документа, по одному на тег, потом их уже можно группировать.

## Задание 6. $lookup

Видео вместе с автором:
```
db.posts.aggregate([
  { $match: { type: "video" } },
  { $lookup: { from: "users", localField: "authorId", foreignField: "userId", as: "author" } },
  { $unwind: "$author" },
  { $project: { _id: 0, postId: 1, likes: 1, "author.name": 1, "author.city": 1 } }
])
```
```
{ postId: 7, likes: 341, author: { name: 'Артём Волков', city: 'Москва' } }
{ postId: 17, likes: 465, author: { name: 'Иван Соколов', city: 'Санкт-Петербург' } }
{ postId: 26, likes: 334, author: { name: 'Дана Нурланова', city: 'Астана' } }
{ postId: 32, likes: 372, author: { name: 'Максим Петров', city: 'Москва' } }
```

- from - коллекция из которой подтягиваем (users)
- localField - поле в posts (authorId)
- foreignField - поле в users с которым сравниваем (userId)
- as - название массива куда кладется результат (author)

Комментарии к посту 11 с никами:
```
db.comments.aggregate([
  { $match: { postId: 11 } },
  { $lookup: { from: "users", localField: "userId", foreignField: "userId", as: "user" } },
  { $unwind: "$user" },
  { $project: { _id: 0, text: 1, "user.username": 1 } }
])
```
3 комментария: от aidar_serikov, madina_t и artem.volkov

## Задание 7. Многоэтапный pipeline

Топ 3 автора по лайкам за сентябрь, с именами:
```
db.posts.aggregate([
  { $match: { createdAt: { $gte: ISODate("2026-09-01") } } },
  { $group: { _id: "$authorId", posts: { $sum: 1 }, totalLikes: { $sum: "$likes" } } },
  { $sort: { totalLikes: -1 } },
  { $limit: 3 },
  { $lookup: { from: "users", localField: "_id", foreignField: "userId", as: "author" } },
  { $unwind: "$author" },
  { $project: { _id: 0, name: "$author.name", posts: 1, totalLikes: 1 } }
])
```
```
{ posts: 3, totalLikes: 717, name: 'Максим Петров' }
{ posts: 2, totalLikes: 688, name: 'Жанна Бекова' }
{ posts: 1, totalLikes: 618, name: 'Иван Соколов' }
```

## Задание 8. Запрос без индекса

```
db.posts.find({ authorId: 1003 }).explain("executionStats")
```
stage: COLLSCAN, nReturned: 6, totalDocsExamined: 32, totalKeysExamined: 0, executionTimeMillis: 0

Чтобы найти 6 постов монга просмотрела всю коллекцию.

## Задание 9. Простой индекс

```
db.posts.createIndex({ authorId: 1 })
db.posts.find({ authorId: 1003 }).explain("executionStats")
```
stage: FETCH, inputStage: IXSCAN (authorId_1), nReturned: 6, totalDocsExamined: 6, totalKeysExamined: 6

| Показатель | До индекса | После индекса |
|---|---|---|
| План | COLLSCAN | IXSCAN |
| nReturned | 6 | 6 |
| totalDocsExamined | 32 | 6 |
| totalKeysExamined | 0 | 6 |
| executionTimeMillis | 0 | 0 |

План поменялся, просмотренных документов стало 6 вместо 32. Время 0 в обоих случаях, потому что документов всего 32, на таком объеме разницу не видно.

## Задания 10-11. Составной индекс

Запрос: посты автора от новых к старым.

Сначала с одним простым индексом:
```
db.posts.find({ authorId: 1003 }).sort({ createdAt: -1 }).explain("executionStats")
```
SORT <- FETCH <- IXSCAN (authorId_1), docs 6, keys 6. Индекс используется, но сортировка делается отдельно в памяти (стадия SORT).

```
db.posts.createIndex({ authorId: 1, createdAt: -1 })
db.posts.find({ authorId: 1003 }).sort({ createdAt: -1 }).explain("executionStats")
```
FETCH <- IXSCAN (authorId_1_createdAt_-1), docs 6, keys 6. Стадии SORT больше нет, документы сразу приходят из индекса в нужном порядке.

## Задание 12. ESR

Запрос с равенством (type), сортировкой (createdAt) и диапазоном (likes):
```
db.posts.find({ type: "photo", likes: { $gte: 200 } }).sort({ createdAt: -1 })
```

Создал два индекса и проверил каждый через hint:
```
db.posts.createIndex({ type: 1, createdAt: -1, likes: 1 })
db.posts.createIndex({ type: 1, likes: 1, createdAt: -1 })
```

| | type, createdAt, likes (ESR) | type, likes, createdAt (ERS) | без индекса |
|---|---|---|---|
| План | FETCH <- IXSCAN | FETCH <- SORT <- IXSCAN | SORT <- COLLSCAN |
| nReturned | 6 | 6 | 6 |
| totalDocsExamined | 6 | 6 | 32 |
| totalKeysExamined | 12 | 6 | 0 |
| executionTimeMillis | 0 | 0 | 0 |

С первым индексом просмотрено больше ключей (12, почти все фото-посты, их 11), зато нет сортировки в памяти. Со вторым ключей ровно 6, но нужна стадия SORT, потому что после диапазона по likes порядок по createdAt в индексе уже не сохраняется. Без hint монга сама выбрала первый индекс (ESR). На 32 документах по времени разницы нет, но на большой коллекции сортировка в памяти дороже чем несколько лишних ключей, поэтому поле сортировки ставят перед диапазоном.

## Индексы

```
db.posts.getIndexes()
```
- _id_
- authorId_1
- authorId_1_createdAt_-1
- type_1_createdAt_-1_likes_1
- type_1_likes_1_createdAt_-1

## Вывод

В этой лабе я поработал с Aggregation Pipeline: фильтровал посты через $match, выбирал поля и считал новое поле через $project, группировал по автору и по типу поста с $sum, $avg, $min, $max. Через $unwind посчитал самые популярные теги, через $lookup подтянул авторов к постам и комментариям. Потом смотрел explain до и после индексов. Без индекса был COLLSCAN и просматривались все 32 документа, с индексом IXSCAN и только 6. Составной индекс убирает отдельную сортировку, если порядок полей подходит под запрос (сначала равенство, потом сортировка, потом диапазон). Время выполнения на таком маленьком наборе везде 0 мс, поэтому смотреть надо на план и на количество просмотренных документов и ключей. Минус индексов в том, что они занимают место и замедляют вставку и обновление, так что создавать их надо только под реальные запросы.
