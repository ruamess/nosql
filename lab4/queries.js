use social_lab4

db.createCollection("posts")
db.createCollection("users")
db.createCollection("comments")

// 1 - $match
db.posts.aggregate([{ $match: { type: "video" } }])
db.posts.aggregate([{ $match: { likes: { $gte: 300, $lte: 500 } } }])
db.posts.aggregate([{ $match: { authorId: 1003, likes: { $gte: 200 } } }])
db.posts.aggregate([{ $match: { type: { $in: ["video", "link"] } } }])

// 2 - $project
db.posts.aggregate([
  { $match: { authorId: 1005 } },
  { $project: { _id: 0, postId: 1, type: 1, likes: 1, createdAt: 1 } }
])
db.posts.aggregate([
  { $project: { _id: 0, postId: 1, likes: 1, views: 1,
      likeRate: { $round: [{ $multiply: [{ $divide: ["$likes", "$views"] }, 100] }, 1] } } }
])

// 3 - $group
db.posts.aggregate([
  { $group: { _id: "$authorId", postCount: { $sum: 1 }, totalLikes: { $sum: "$likes" },
      avgLikes: { $avg: "$likes" }, minLikes: { $min: "$likes" }, maxLikes: { $max: "$likes" } } }
])
db.posts.aggregate([
  { $group: { _id: "$type", postCount: { $sum: 1 }, avgLikes: { $avg: "$likes" }, totalViews: { $sum: "$views" } } }
])

// 4 - $sort, $limit
db.posts.aggregate([
  { $match: { views: { $gt: 0 } } },
  { $sort: { likes: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, postId: 1, authorId: 1, likes: 1, text: 1 } }
])

// 5 - $unwind
db.posts.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 4 }
])

// 6 - $lookup
db.posts.aggregate([
  { $match: { type: "video" } },
  { $lookup: { from: "users", localField: "authorId", foreignField: "userId", as: "author" } },
  { $unwind: "$author" },
  { $project: { _id: 0, postId: 1, likes: 1, "author.name": 1, "author.city": 1 } }
])
db.comments.aggregate([
  { $match: { postId: 11 } },
  { $lookup: { from: "users", localField: "userId", foreignField: "userId", as: "user" } },
  { $unwind: "$user" },
  { $project: { _id: 0, text: 1, "user.username": 1 } }
])

// 7 - pipeline из нескольких этапов
db.posts.aggregate([
  { $match: { createdAt: { $gte: ISODate("2026-09-01") } } },
  { $group: { _id: "$authorId", posts: { $sum: 1 }, totalLikes: { $sum: "$likes" } } },
  { $sort: { totalLikes: -1 } },
  { $limit: 3 },
  { $lookup: { from: "users", localField: "_id", foreignField: "userId", as: "author" } },
  { $unwind: "$author" },
  { $project: { _id: 0, name: "$author.name", posts: 1, totalLikes: 1 } }
])

// 8 - без индекса
db.posts.find({ authorId: 1003 }).explain("executionStats")

// 9 - простой индекс
db.posts.createIndex({ authorId: 1 })
db.posts.find({ authorId: 1003 }).explain("executionStats")

// 10, 11 - составной индекс
db.posts.find({ authorId: 1003 }).sort({ createdAt: -1 }).explain("executionStats")
db.posts.createIndex({ authorId: 1, createdAt: -1 })
db.posts.find({ authorId: 1003 }).sort({ createdAt: -1 }).explain("executionStats")

// 12 - ESR
db.posts.createIndex({ type: 1, createdAt: -1, likes: 1 })
db.posts.createIndex({ type: 1, likes: 1, createdAt: -1 })
db.posts.find({ type: "photo", likes: { $gte: 200 } }).sort({ createdAt: -1 }).hint({ type: 1, createdAt: -1, likes: 1 }).explain("executionStats")
db.posts.find({ type: "photo", likes: { $gte: 200 } }).sort({ createdAt: -1 }).hint({ type: 1, likes: 1, createdAt: -1 }).explain("executionStats")
db.posts.find({ type: "photo", likes: { $gte: 200 } }).sort({ createdAt: -1 }).explain("executionStats")

db.posts.getIndexes()
