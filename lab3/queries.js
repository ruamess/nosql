// 4
use libraryDB
db.createCollection("books")
show collections

// 5
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

// 6
db.books.insertMany([
  { bookId: 302, title: "Преступление и наказание", author: "Фёдор Достоевский", language: "ru",
    year: 2021, pages: 608, rating: 4.6, copies: 3, available: true, addedAt: ISODate("2024-09-12"),
    publisher: { name: "Эксмо", city: "Москва" }, genres: ["роман", "классика"] },
  { bookId: 303, title: "Чистый код", author: "Роберт Мартин", language: "ru",
    year: 2019, pages: 464, rating: 4.7, copies: 2, available: true, addedAt: ISODate("2024-10-03"),
    publisher: { name: "Питер", city: "Санкт-Петербург" }, genres: ["программирование", "учебная"] },
  { bookId: 304, title: "Грокаем алгоритмы", author: "Адитья Бхаргава", language: "ru",
    year: 2022, pages: 288, rating: 4.5, copies: 5, available: true, addedAt: ISODate("2025-02-18"),
    publisher: { name: "Питер", city: "Санкт-Петербург" }, genres: ["программирование", "алгоритмы", "учебная"] },
  { bookId: 305, title: "Абай жолы", author: "Мұхтар Әуезов", language: "kk",
    year: 2018, pages: 736, rating: 4.9, copies: 2, available: true, addedAt: ISODate("2024-09-12"),
    publisher: { name: "Жазушы", city: "Алматы" }, genres: ["роман", "классика", "исторический"] },
  { bookId: 306, title: "Кочевники", author: "Ильяс Есенберлин", language: "ru",
    year: 2019, pages: 928, rating: 4.7, copies: 1, available: true, addedAt: ISODate("2024-11-25"),
    publisher: { name: "Жазушы", city: "Алматы" }, genres: ["роман", "исторический"] },
  { bookId: 307, title: "Гарри Поттер и философский камень", author: "Джоан Роулинг", language: "ru",
    year: 2014, pages: 432, rating: 4.8, copies: 6, available: true, addedAt: ISODate("2024-09-12"),
    publisher: { name: "Махаон", city: "Москва" }, genres: ["фэнтези", "детская"] },
  { bookId: 308, title: "Sapiens. Краткая история человечества", author: "Юваль Ной Харари", language: "ru",
    year: 2016, pages: 520, rating: 4.4, copies: 3, available: true, addedAt: ISODate("2025-01-14"),
    publisher: { name: "Синдбад", city: "Москва" }, genres: ["нон-фикшн", "история"] },
  { bookId: 309, title: "Совершенный код", author: "Стив Макконнелл", language: "ru",
    year: 2017, pages: 896, rating: 4.6, copies: 1, available: true, addedAt: ISODate("2024-10-03"),
    publisher: { name: "Русская редакция", city: "Москва" }, genres: ["программирование", "учебная"] },
  { bookId: 310, title: "Три товарища", author: "Эрих Мария Ремарк", language: "ru",
    year: 2013, pages: 384, rating: 4.7, copies: 4, available: true, addedAt: ISODate("2024-09-12"),
    publisher: { name: "АСТ", city: "Москва" }, genres: ["роман", "классика"] },
  { bookId: 311, title: "Изучаем Python", author: "Эрик Мэтиз", language: "ru",
    year: 2023, pages: 512, rating: 4.5, copies: 3, available: true, addedAt: ISODate("2025-09-05"),
    publisher: { name: "Питер", city: "Санкт-Петербург" }, genres: ["программирование", "учебная"] },
  { bookId: 312, title: "Атлант расправил плечи", author: "Айн Рэнд", language: "ru",
    year: 2020, pages: 1136, rating: 4.1, copies: 1, available: true, addedAt: ISODate("2025-03-21"),
    publisher: { name: "Альпина Паблишер", city: "Москва" }, genres: ["роман", "философия"] },
  { bookId: 313, title: "1984", author: "Джордж Оруэлл", language: "ru",
    year: 2022, pages: 320, rating: 4.6, copies: 5, available: true, addedAt: ISODate("2025-02-18"),
    publisher: { name: "АСТ", city: "Москва" }, genres: ["роман", "антиутопия", "классика"] },
  { bookId: 314, title: "Turbo Pascal 7.0. Начальный курс", author: "Валерий Фаронов", language: "ru",
    year: 2003, pages: 576, rating: 3.2, copies: 2, available: false, addedAt: ISODate("2024-09-12"),
    publisher: { name: "ОМД Групп", city: "Москва" }, genres: ["программирование", "учебная"] },
  { bookId: 315, title: "Самоучитель работы на компьютере", author: "Александр Левин", language: "ru",
    year: 2005, pages: 656, rating: 2.9, copies: 1, available: false, addedAt: ISODate("2024-09-12"),
    publisher: { name: "Питер", city: "Санкт-Петербург" }, genres: ["учебная"] }
])
db.books.countDocuments()

// 7
db.books.find()
db.books.findOne({ bookId: 305 })
db.books.findOne({ author: "Роберт Мартин" })

// 8
db.books.find({ language: "kk" })
db.books.find({ year: 2019 })
db.books.find({ available: false })

db.books.find({ rating: { $gt: 4.7 } })
db.books.find({ pages: { $gte: 700 } })
db.books.find({ year: { $lt: 2010 } })
db.books.find({ pages: { $gte: 300, $lte: 450 } })
db.books.find({ "publisher.city": { $ne: "Москва" } })

// 9
db.books.find({ available: true, rating: { $gte: 4.7 } })
db.books.find({ year: { $gte: 2019 }, pages: { $lt: 500 } })
db.books.find({ $or: [{ year: { $lt: 2010 } }, { rating: { $gte: 4.8 } }] })

// 10
db.books.find({ "publisher.city": "Алматы" })
db.books.find({ "publisher.name": "Питер" })

// 11
db.books.find({ genres: "классика" })
db.books.find({ genres: { $all: ["программирование", "учебная"] } })

// 12
db.books.find({}, { _id: 0, title: 1, author: 1 })
db.books.find({ genres: "роман" }, { _id: 0, title: 1, year: 1, rating: 1 })

// 13
db.books.find().sort({ year: 1 })
db.books.find().sort({ pages: -1 })
db.books.find().sort({ rating: -1 }).limit(3)

// 14
db.books.updateOne({ bookId: 303 }, { $set: { rating: 4.8, copies: 3 } })
db.books.findOne({ bookId: 303 })

// 15
db.books.updateMany({ "publisher.name": "Питер" }, { $set: { shelf: "IT-2" } })

// 16
db.books.updateOne({ bookId: 304 }, { $inc: { copies: 2 } })

// 17
db.books.updateOne({ bookId: 313 }, { $push: { genres: "фантастика" } })

// 18
db.books.findOne({ bookId: 312 })
db.books.deleteOne({ bookId: 312 })
db.books.findOne({ bookId: 312 })

// 19
db.books.find({ available: false })
db.books.deleteMany({ available: false })

// 20
db.books.find()
db.books.countDocuments()

// 22
db.books.find(
  { "publisher.city": "Москва", rating: { $gte: 4.5 } },
  { _id: 0, title: 1, author: 1, rating: 1 }
).sort({ rating: -1 }).limit(3)

// 23
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
