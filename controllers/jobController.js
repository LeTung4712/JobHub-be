const Job = require("../models/Job");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

// @desc      Lấy tất cả công việc
// @route     GET /api/jobs
// @access    Public
exports.getJobs = asyncHandler(async (req, res, next) => {
  // Tạo một copy của req.query
  const reqQuery = { ...req.query };

  // Các trường cần loại bỏ
  const removeFields = [
    "select",
    "sort",
    "page",
    "limit",
    "search",
    "postDate",
  ];

  // Loại bỏ các trường này khỏi reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Chuyển đổi tham số type thành postType nếu có
  if (reqQuery.type) {
    reqQuery.postType = reqQuery.type;
    delete reqQuery.type;
  }

  // Xử lý tham số mức lương
  const minSalary = parseFloat(req.query.minSalary);
  const maxSalary = parseFloat(req.query.maxSalary);

  if (!isNaN(minSalary)) {
    delete reqQuery.minSalary;
  }

  if (!isNaN(maxSalary)) {
    delete reqQuery.maxSalary;
  }

  // Tạo query string
  let queryStr = JSON.stringify(reqQuery);

  // Tạo operators ($gt, $gte, v.v.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Parse query string thành object
  let queryObj = JSON.parse(queryStr);

  // Tìm kiếm theo từ khóa (search)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    queryObj.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { company: searchRegex },
      { location: searchRegex },
    ];
  }

  // Áp dụng lọc theo khoảng lương
  if (!isNaN(minSalary) || !isNaN(maxSalary)) {
    queryObj.$or = queryObj.$or || [];

    const salaryConditions = [];

    // Trường hợp 1: Có cả salaryMin và salaryMax
    const minMaxCondition = {};
    if (!isNaN(minSalary)) {
      minMaxCondition.salaryMin = { $gte: minSalary };
    }
    if (!isNaN(maxSalary)) {
      minMaxCondition.salaryMax = { $lte: maxSalary };
    }
    if (Object.keys(minMaxCondition).length > 0) {
      salaryConditions.push(minMaxCondition);
    }

    // Trường hợp 2: Lọc theo khoảng trong chuỗi salary
    if (!isNaN(minSalary) && !isNaN(maxSalary)) {
      salaryConditions.push({
        salary: {
          $regex: new RegExp(
            `(${minSalary}|${minSalary + 1}|${minSalary + 2}).*?(${maxSalary}|${
              maxSalary - 1
            }|${maxSalary - 2})`
          ),
        },
      });
    } else if (!isNaN(minSalary)) {
      salaryConditions.push({
        salary: { $regex: new RegExp(`${minSalary}`) },
      });
    } else if (!isNaN(maxSalary)) {
      salaryConditions.push({
        salary: { $regex: new RegExp(`${maxSalary}`) },
      });
    }

    // Thêm điều kiện lương vào truy vấn
    if (salaryConditions.length > 0) {
      if (queryObj.$or.length > 0) {
        // Nếu đã có điều kiện $or từ search, thêm điều kiện $and
        queryObj.$and = [{ $or: queryObj.$or }, { $or: salaryConditions }];
        delete queryObj.$or;
      } else {
        queryObj.$or = salaryConditions;
      }
    }
  }

  // Lọc theo thời gian đăng
  if (req.query.postDate) {
    const now = new Date();
    let dateFilter;

    switch (req.query.postDate) {
      case "24h":
        dateFilter = new Date(now.setDate(now.getDate() - 1));
        break;
      case "3days":
        dateFilter = new Date(now.setDate(now.getDate() - 3));
        break;
      case "week":
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        dateFilter = null;
    }

    if (dateFilter) {
      queryObj.createdAt = { $gte: dateFilter };
    }
  }

  // Tìm tài nguyên
  let query = Job.find(queryObj).populate(
    "author",
    "fullName email avatar company"
  );

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Job.countDocuments(queryObj);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const jobs = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: jobs.length,
    pagination,
    total,
    data: jobs,
  });
});

// @desc      Lấy một công việc
// @route     GET /api/jobs/:id
// @access    Public
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate(
    "author",
    "fullName email avatar phone location currentPosition"
  );

  if (!job) {
    return next(
      new ErrorResponse(`Không tìm thấy công việc với id ${req.params.id}`, 404)
    );
  }

  // Tăng số lượt xem
  job.views += 1;
  await job.save();

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc      Tạo công việc mới
// @route     POST /api/jobs
// @access    Private
exports.createJob = asyncHandler(async (req, res, next) => {
  // Thêm user vào req.body
  req.body.author = req.user.id;

  // Xử lý file CV nếu có
  if (req.file) {
    req.body.cvFile = req.file.filename;

    // Nếu mảng requirements và benefits được gửi dưới dạng chuỗi JSON, chuyển lại thành mảng
    if (req.body.requirements && typeof req.body.requirements === "string") {
      try {
        req.body.requirements = JSON.parse(req.body.requirements);
      } catch (err) {
        req.body.requirements = [];
      }
    }

    if (req.body.benefits && typeof req.body.benefits === "string") {
      try {
        req.body.benefits = JSON.parse(req.body.benefits);
      } catch (err) {
        req.body.benefits = [];
      }
    }
  }

  const job = await Job.create(req.body);

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc      Cập nhật công việc
// @route     PUT /api/jobs/:id
// @access    Private
exports.updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Không tìm thấy công việc với id ${req.params.id}`, 404)
    );
  }

  // Đảm bảo người dùng là tác giả
  if (job.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `Người dùng ${req.user.id} không có quyền cập nhật công việc này`,
        401
      )
    );
  }

  // Xử lý file CV nếu có
  if (req.file) {
    req.body.cvFile = req.file.filename;

    // Nếu có file CV cũ, xóa nó
    if (job.cvFile) {
      const fs = require("fs");
      const oldFilePath = `${process.cwd()}/uploads/${job.cvFile}`;

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Nếu mảng requirements và benefits được gửi dưới dạng chuỗi JSON, chuyển lại thành mảng
    if (req.body.requirements && typeof req.body.requirements === "string") {
      try {
        req.body.requirements = JSON.parse(req.body.requirements);
      } catch (err) {
        req.body.requirements = [];
      }
    }

    if (req.body.benefits && typeof req.body.benefits === "string") {
      try {
        req.body.benefits = JSON.parse(req.body.benefits);
      } catch (err) {
        req.body.benefits = [];
      }
    }
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc      Xóa công việc
// @route     DELETE /api/jobs/:id
// @access    Private
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Không tìm thấy công việc với id ${req.params.id}`, 404)
    );
  }

  // Đảm bảo người dùng là tác giả
  if (job.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `Người dùng ${req.user.id} không có quyền xóa công việc này`,
        401
      )
    );
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc      Lấy các công việc của người dùng hiện tại
// @route     GET /api/jobs/my-jobs
// @access    Private
exports.getMyJobs = asyncHandler(async (req, res, next) => {
  // Tạo một copy của req.query
  const reqQuery = { ...req.query };

  // Các trường cần loại bỏ
  const removeFields = ["select", "sort", "page", "limit", "search", "status"];

  // Loại bỏ các trường này khỏi reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Tạo query string
  let queryStr = JSON.stringify(reqQuery);

  // Tạo operators ($gt, $gte, v.v.)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Parse query string thành object
  let queryObj = JSON.parse(queryStr);

  // Luôn lấy các công việc của người dùng hiện tại
  queryObj.author = req.user.id;

  // Tìm kiếm theo từ khóa (search)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    queryObj.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { company: searchRegex },
      { location: searchRegex },
    ];
  }

  // Lọc theo trạng thái
  if (req.query.status) {
    queryObj.status = req.query.status;
  }

  // Tìm tài nguyên
  let query = Job.find(queryObj);

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Job.countDocuments(queryObj);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const jobs = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: jobs.length,
    pagination,
    total,
    data: jobs,
  });
});

// @desc      Tải xuống CV
// @route     GET /api/jobs/download-cv/:fileId
// @access    Private
exports.downloadCV = asyncHandler(async (req, res, next) => {
  const { fileId } = req.params;

  if (!fileId) {
    return next(new ErrorResponse("Không tìm thấy file CV", 404));
  }

  const filePath = `${process.cwd()}/uploads/${fileId}`;

  // Kiểm tra xem file có tồn tại không
  const fs = require("fs");
  if (!fs.existsSync(filePath)) {
    return next(new ErrorResponse("Không tìm thấy file CV", 404));
  }

  res.download(filePath);
});

// @desc      Cập nhật trạng thái công việc
// @route     PATCH /api/jobs/:id/status
// @access    Private
exports.updateJobStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!["active", "expired", "draft", "paused"].includes(status)) {
    return next(new ErrorResponse("Trạng thái không hợp lệ", 400));
  }

  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`Không tìm thấy công việc với id ${req.params.id}`, 404)
    );
  }

  // Đảm bảo người dùng là tác giả
  if (job.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `Người dùng ${req.user.id} không có quyền cập nhật công việc này`,
        401
      )
    );
  }

  job = await Job.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: job,
  });
});
