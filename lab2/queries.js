use library_db

// задание 2
show collections

// задание 4 — массив документов
db.books.updateOne(
  { bookId: 303 },
  { $set: { reviews: [
    { readerId: 1, rating: 5, text: "Обязательно к прочтению любому джуну", date: ISODate("2026-03-14") },
    { readerId: 4, rating: 4, text: "Примеры на Java, но идеи универсальные", date: ISODate("2026-06-02") }
  ]}}
)
db.books.updateOne(
  { bookId: 301 },
  { $set: { reviews: [
    { readerId: 2, rating: 5, text: "Перечитываю каждые пару лет", date: ISODate("2025-11-20") },
    { readerId: 3, rating: 5, text: "Лучшее издание, хорошая бумага", date: ISODate("2026-01-09") },
    { readerId: 5, rating: 3, text: "Не зашло, слишком затянуто", date: ISODate("2026-07-28") }
  ]}}
)
db.books.updateOne(
  { bookId: 304 },
  { $set: { reviews: [
    { readerId: 6, rating: 4, text: "Картинки помогают, но мало задач", date: ISODate("2026-08-15") }
  ]}}
)

// задание 5 — dot notation
db.books.find({ "publisher.city": "Алматы" })
db.books.find({ "publisher.name": "Питер" })
db.books.find({ "publisher.city": "Москва", year: { $gte: 2018 } })
db.books.find({ "reviews.rating": { $lte: 3 } })

// задание 6 — массивы
db.books.find({ authors: "Роберт Мартин" })
db.books.find({ authors: { $all: ["Эрих Гамма", "Ральф Джонсон"] } })
db.books.updateOne({ bookId: 313 }, { $push: { authors: "Джон Влиссидес" } })

// задание 7 — referencing
db.readers.insertMany([
  { _id: 1, name: "Айдар Сериков", phone: "+7 701 254 18 73", email: "aidar.serikov@gmail.com",
    cardNumber: "LB-2023-0412", registeredAt: ISODate("2023-02-14"),
    contact: { city: "Алматы", street: "Абая 52", apartment: 14 },
    favoriteGenres: ["программирование", "нон-фикшн"] },
  { _id: 2, name: "Дана Нурланова", phone: "+7 777 810 44 02", email: "dana.nurlan@mail.ru",
    cardNumber: "LB-2023-0977", registeredAt: ISODate("2023-05-03"),
    contact: { city: "Астана", street: "Кабанбай батыра 11", apartment: 203 },
    favoriteGenres: ["роман", "фэнтези"] },
  { _id: 3, name: "Максим Петров", phone: "+7 916 402 77 19", email: "m.petrov@yandex.ru",
    cardNumber: "LB-2022-1830", registeredAt: ISODate("2022-11-20"),
    contact: { city: "Москва", street: "Ленинский проспект 40", apartment: 88 },
    favoriteGenres: ["программирование", "роман"] },
  { _id: 4, name: "Алия Касымова", phone: "+7 705 331 90 56", email: "aliya.k@kbtu.kz",
    cardNumber: "LB-2024-0055", registeredAt: ISODate("2024-01-09"),
    contact: { city: "Алматы", street: "Толе би 59", apartment: 7 },
    favoriteGenres: ["программирование", "фэнтези"] },
  { _id: 5, name: "Иван Соколов", phone: "+7 921 655 28 40", email: "sokolov.iv@gmail.com",
    cardNumber: "LB-2022-0301", registeredAt: ISODate("2022-06-01"),
    contact: { city: "Санкт-Петербург", street: "Невский проспект 100", apartment: 12 },
    favoriteGenres: ["нон-фикшн", "исторический роман"] },
  { _id: 6, name: "Мадина Турсунова", phone: "+7 702 776 30 84", email: "madina.t@mail.ru",
    cardNumber: "LB-2025-1204", registeredAt: ISODate("2025-09-02"),
    contact: { city: "Караганда", street: "Бухар жырау 30", apartment: 45 },
    favoriteGenres: ["программирование"] }
])

db.books.updateOne({ bookId: 303 }, { $set: { readerIds: [1, 4] } })
db.books.updateOne({ bookId: 301 }, { $set: { readerIds: [2, 3, 5] } })
db.books.updateOne({ bookId: 304 }, { $set: { readerIds: [6] } })
db.books.updateOne({ bookId: 311 }, { $set: { readerIds: [4, 6] } })
db.books.updateOne({ bookId: 306 }, { $set: { readerIds: [5] } })
db.books.updateOne({ bookId: 307 }, { $set: { readerIds: [2] } })

db.books.find({ readerIds: 4 }, { _id: 0, title: 1, readerIds: 1 })
db.readers.find({ _id: { $in: db.books.findOne({ bookId: 301 }).readerIds } }, { _id: 0, name: 1 })

// задание 8 — embedding vs referencing (издательство)
db.books.updateMany({ "publisher.name": "АСТ" }, { $set: { publisherId: 1 } })
db.books.updateMany({ "publisher.name": "Эксмо" }, { $set: { publisherId: 2 } })
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { publisherId: 3 } })
db.books.updateMany({ "publisher.name": "Жазушы" }, { $set: { publisherId: 4 } })
db.books.updateMany({ "publisher.name": "Махаон" }, { $set: { publisherId: 5 } })
db.books.updateMany({ "publisher.name": "Синдбад" }, { $set: { publisherId: 6 } })
db.books.updateMany({ "publisher.name": "Русская редакция" }, { $set: { publisherId: 7 } })
db.books.updateMany({ "publisher.name": "Альпина Паблишер" }, { $set: { publisherId: 8 } })

// embedding: всё в одном запросе
db.books.find({ "publisher.city": "Санкт-Петербург" }, { _id: 0, title: 1, "publisher.name": 1 })

// referencing: сначала id издательства, потом книги
db.publishers.find({ city: "Санкт-Петербург" }, { _id: 1 })
db.books.find({ publisherId: 3 }, { _id: 0, title: 1, publisherId: 1 })

// обновление: embedding — трогаем все книги, referencing — один документ
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { "publisher.city": "Санкт-Петербург" } })
db.publishers.updateOne({ _id: 3 }, { $set: { city: "Санкт-Петербург" } })

// $lookup
db.books.aggregate([
  { $match: { bookId: 301 } },
  { $lookup: { from: "readers", localField: "readerIds", foreignField: "_id", as: "readerInfo" } },
  { $project: { _id: 0, title: 1, "readerInfo.name": 1, "readerInfo.contact.city": 1 } }
])

db.books.aggregate([
  { $lookup: { from: "publishers", localField: "publisherId", foreignField: "_id", as: "publisherInfo" } },
  { $project: { _id: 0, title: 1, "publisherInfo.name": 1, "publisherInfo.website": 1 } }
])
