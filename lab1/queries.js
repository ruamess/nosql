// 1
db.users.find()

// 2
db.users.findOne({ userId: 1003 })

// 3
db.users.find({ city: "Москва" })

// 4
db.users.find({ age: { $gte: 30 } })

// 5
db.users.find({ messagesSent: { $lt: 2000 } })

// 6
db.users.find({ city: "Алматы", isPremium: true })

// 7
db.users.find({ $or: [{ city: "Астана" }, { age: { $lt: 21 } }] })

// 8
db.users.find({ city: { $in: ["Шымкент", "Караганда", "Санкт-Петербург"] } })

// 9
db.users.find({ contacts: 1003 })

// 10
db.users.find({ "profile.status": "online" })

// 11
db.users.find({}, { _id: 0, username: 1, phone: 1, city: 1 })

// 12
db.users.find().sort({ messagesSent: -1 })

// 13
db.users.find().sort({ age: 1 }).limit(3)

// 14
db.users.updateOne({ userId: 1002 }, { $set: { city: "Алматы" } })

// 15
db.users.updateOne({ userId: 1004 }, { $push: { interests: "mongodb" } })

// 16
db.users.updateMany({ "profile.lastSeen": { $lt: ISODate("2026-09-08T00:00:00Z") } }, { $set: { "profile.status": "inactive" } })

// 17
db.users.deleteOne({ username: "promo_kz_official" })

// 18
db.users.find()
