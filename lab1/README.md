# Лабораторная работа №1

Дисциплина: Проектирование и применение NoSQL-технологий

Тема: Основы работы с MongoDB: создание базы данных, коллекций и CRUD-операции

Вариант: 3 — Социальная сеть (коллекция users). Сделал в виде мессенджера: кроме users есть ещё коллекция messages с перепиской.

Инструменты: MongoDB 8.0.4 в Docker, mongosh, mongoexport.

## Цель работы

Изучить документную модель MongoDB и получить практические навыки создания базы данных, коллекций и BSON-документов, выполнения CRUD-операций, фильтрации, сортировки, проекции, работы с массивами и вложенными документами.

## Файлы

- `seed.js` — создание базы и вставка данных
- `queries.js` — 18 запросов из задания
- `messenger_db.users.json` — экспорт коллекции users после всех запросов
- `messenger_db.messages.json` — экспорт коллекции messages

## Предметная область

База мессенджера. У пользователя есть телефон, город, возраст, список контактов (userId других пользователей), интересы, профиль (статус, последний визит, био, аватар) и настройки приложения. Пользователи пишут друг другу личные сообщения: у сообщения есть отправитель, получатель, текст, статус доставки, вложения, реакции и информация об устройстве.

## Создание базы и коллекций

```
use messenger_db
db.createCollection("users")
db.createCollection("messages")
```

## Структура документа users

```
{
  userId: 1001,
  username: "aidar_serikov",
  firstName: "Айдар",
  lastName: "Сериков",
  phone: "+7 701 254 18 73",
  age: 24,
  city: "Алматы",
  isPremium: true,
  contacts: [1002, 1003, 1005, 1008],
  interests: ["backend", "mongodb", "футбол", "go"],
  profile: {
    bio: "Backend-разработчик в Kaspi.kz. Пишу на Go и Python.",
    status: "online",
    lastSeen: ISODate("2026-09-09T10:42:15Z"),
    avatar: "https://cdn.msgr.kz/avatars/aidar_serikov.jpg"
  },
  settings: { language: "ru", theme: "dark", notifications: true, privacy: "contacts" },
  registeredAt: ISODate("2023-02-14T08:31:00Z"),
  messagesSent: 4812
}
```

Массивы: contacts, interests. Вложенные документы: profile, settings.

## Структура документа messages

```
{
  messageId: 50002,
  chatId: "dm_1001_1003",
  senderId: 1003,
  receiverId: 1001,
  text: "Привет. Да, давай на понедельник — в пятницу ещё helm-чарт не готов.",
  sentAt: ISODate("2026-09-08T09:14:37Z"),
  status: "read",
  edited: false,
  attachments: [{ type: "file", name: "values.yaml", sizeKb: 4 }],
  reactions: [{ userId: 1001, emoji: "👍" }],
  meta: { device: "macos", appVersion: "6.3.0", ip: "77.88.55.242" }
}
```

senderId и receiverId ссылаются на users.userId.

## Исходные данные

В users вставлено 11 документов (10 пользователей и один спам-аккаунт promo_kz_official, который потом удаляется в 17 задании), в messages — 25 сообщений. Все документы в seed.js.

| userId | username | город | возраст | статус |
|---|---|---|---|---|
| 1001 | aidar_serikov | Алматы | 24 | online |
| 1002 | dana.nurlan | Астана | 22 | offline |
| 1003 | maks_petrov | Москва | 29 | online |
| 1004 | aliya.k | Алматы | 20 | offline |
| 1005 | ivan_sokolov | Санкт-Петербург | 35 | away |
| 1006 | zhanna_b | Павлодар | 27 | offline |
| 1007 | artem.volkov | Москва | 31 | online |
| 1008 | madina_t | Караганда | 19 | offline |
| 1009 | sergey_kim | Москва | 41 | away |
| 1010 | kamila.ab | Астана | 25 | online |
| 1011 | promo_kz_official | Алматы | 33 | banned |

## Запросы

1. Все документы
```
db.users.find()
```

2. По уникальному идентификатору
```
db.users.findOne({ userId: 1003 })
```
Вернул maks_petrov.

3. По строковому полю
```
db.users.find({ city: "Москва" })
```
maks_petrov, artem.volkov, sergey_kim.

4. $gte
```
db.users.find({ age: { $gte: 30 } })
```
ivan_sokolov, artem.volkov, sergey_kim, promo_kz_official.

5. $lt
```
db.users.find({ messagesSent: { $lt: 2000 } })
```
aliya.k, madina_t, kamila.ab, promo_kz_official.

6. Два условия
```
db.users.find({ city: "Алматы", isPremium: true })
```
aidar_serikov.

7. $or
```
db.users.find({ $or: [{ city: "Астана" }, { age: { $lt: 21 } }] })
```
dana.nurlan, aliya.k, madina_t, kamila.ab.

8. $in
```
db.users.find({ city: { $in: ["Павлодар", "Караганда", "Санкт-Петербург"] } })
```
ivan_sokolov, zhanna_b, madina_t.

9. Элемент массива — у кого в контактах есть 1003
```
db.users.find({ contacts: 1003 })
```
aidar_serikov, ivan_sokolov, artem.volkov, sergey_kim, kamila.ab.

10. Поле вложенного документа
```
db.users.find({ "profile.status": "online" })
```
aidar_serikov, maks_petrov, artem.volkov, kamila.ab.

11. Проекция
```
db.users.find({}, { _id: 0, username: 1, phone: 1, city: 1 })
```

12. Сортировка
```
db.users.find().sort({ messagesSent: -1 })
```
Первый ivan_sokolov (12488), последний madina_t (418).

13. limit
```
db.users.find().sort({ age: 1 }).limit(3)
```
madina_t (19), aliya.k (20), dana.nurlan (22).

14. $set
```
db.users.updateOne({ userId: 1002 }, { $set: { city: "Алматы" } })
```
matchedCount: 1, modifiedCount: 1.

15. $push
```
db.users.updateOne({ userId: 1004 }, { $push: { interests: "mongodb" } })
```
interests у aliya.k стал ["студент", "python", "аниме", "k-pop", "mongodb"].

16. updateMany — все кто не заходил с 8 сентября получают статус inactive
```
db.users.updateMany(
  { "profile.lastSeen": { $lt: ISODate("2026-09-08T00:00:00Z") } },
  { $set: { "profile.status": "inactive" } }
)
```
matchedCount: 2, modifiedCount: 2 (zhanna_b, promo_kz_official).

17. deleteOne
```
db.users.deleteOne({ username: "promo_kz_official" })
```
deletedCount: 1.

18. Итоговое содержимое
```
db.users.find()
```
Осталось 10 документов, экспорт в messenger_db.users.json.

## Экспорт

```
mongoexport --db messenger_db --collection users --jsonArray --pretty --out messenger_db.users.json
mongoexport --db messenger_db --collection messages --jsonArray --pretty --out messenger_db.messages.json
```

## Массивы и вложенные документы

Массив contacts хранит id собеседников, interests — интересы. По массиву можно искать сразу по одному элементу (`{ contacts: 1003 }`) и добавлять элементы через $push. В messages массивы attachments и reactions состоят из вложенных документов, потому что у сообщения может быть несколько файлов и реакций.

Вложенные документы profile и settings группируют поля, которые всегда читаются вместе с пользователем. К ним обращаемся через точку: `"profile.status"`, `"profile.lastSeen"`. В реляционной базе это были бы отдельные таблицы и JOIN.

Сообщения вынесены в отдельную коллекцию и ссылаются на пользователя по userId, потому что их много и они постоянно добавляются, встраивать их в документ пользователя было бы плохо.

## Вывод

Создана база messenger_db с коллекциями users и messages. Выполнены все 18 запросов: выборка, фильтрация с $gte, $lt, $or, $in, поиск по массиву и вложенному документу, проекция, сортировка, limit, обновление через $set, $push, updateMany и удаление через deleteOne. Документная модель позволяет хранить профиль пользователя и сообщение с вложениями одним документом без JOIN.
