const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");
const Job = require("../models/Job");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create sample users
const createUsers = async () => {
  try {
    await User.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("123456", salt);

    const users = [
      {
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        password,
        phone: "0987654321",
        location: "Hà Nội, Việt Nam",
        currentPosition: "Frontend Developer",
        yearsOfExperience: "3",
        education: "Đại học Bách Khoa Hà Nội",
        skills: ["React", "JavaScript", "HTML/CSS", "TypeScript", "Node.js"],
        bio: "Là một Frontend Developer với 3 năm kinh nghiệm, tôi đã làm việc với nhiều công nghệ web hiện đại như React, Angular và Vue.",
        website: "https://example.com",
        isAvailableForWork: true,
        role: "user",
      },
      {
        fullName: "Trần Thị B",
        email: "tranthib@example.com",
        password,
        phone: "0123456789",
        location: "Hồ Chí Minh, Việt Nam",
        currentPosition: "UI/UX Designer",
        yearsOfExperience: "5",
        education: "Đại học FPT",
        skills: [
          "Figma",
          "Adobe XD",
          "Photoshop",
          "Illustrator",
          "UX Research",
        ],
        bio: "UI/UX Designer với 5 năm kinh nghiệm thiết kế giao diện người dùng cho các ứng dụng web và di động.",
        website: "https://portfolio.example.com",
        isAvailableForWork: false,
        role: "user",
      },
      {
        fullName: "Lê Văn C",
        email: "levanc@example.com",
        password,
        phone: "0369852147",
        location: "Đà Nẵng, Việt Nam",
        currentPosition: "Backend Developer",
        yearsOfExperience: "4",
        education: "Đại học Đà Nẵng",
        skills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker"],
        bio: "Backend Developer với sở trường về các công nghệ serverless và microservices.",
        website: "https://levanc.example.com",
        isAvailableForWork: true,
        role: "user",
      },
      {
        fullName: "Phạm Thị D",
        email: "phamthid@example.com",
        password,
        phone: "0912345678",
        location: "Hà Nội, Việt Nam",
        currentPosition: "HR Manager",
        yearsOfExperience: "7",
        education: "Đại học Ngoại Thương",
        skills: [
          "Recruiting",
          "Talent Management",
          "Employee Relations",
          "Training",
        ],
        bio: "HR Manager với hơn 7 năm kinh nghiệm trong lĩnh vực tuyển dụng và quản lý nhân sự cho các công ty công nghệ.",
        website: "https://linkedin.com/phamthid",
        isAvailableForWork: false,
        role: "user",
      },
      {
        fullName: "Admin User",
        email: "admin@example.com",
        password,
        phone: "0987654000",
        location: "Hà Nội, Việt Nam",
        role: "admin",
      },
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Đã thêm ${createdUsers.length} người dùng mẫu`);

    return createdUsers;
  } catch (error) {
    console.error("❌ Lỗi khi tạo người dùng mẫu:", error);
    process.exit(1);
  }
};

// Tạo mẫu công việc
const createJobs = async (users) => {
  try {
    await Job.deleteMany();

    const employer1 = users[0]._id;
    const employer2 = users[1]._id;
    const jobSeeker1 = users[2]._id;
    const jobSeeker2 = users[3]._id;

    const jobs = [
      {
        title: "Frontend Developer (React)",
        location: "Hà Nội",
        salary: "15-20 triệu",
        salaryMin: 15000000,
        salaryMax: 20000000,
        category: "software",
        type: "full-time",
        experience: "mid",
        description:
          "Chúng tôi đang tìm kiếm một Frontend Developer có kinh nghiệm để tham gia vào đội ngũ phát triển sản phẩm mới. Bạn sẽ làm việc với các công nghệ hiện đại như React, Redux và Material-UI để xây dựng giao diện người dùng hấp dẫn và trải nghiệm người dùng tuyệt vời.",
        requirements: [
          "Tối thiểu 3 năm kinh nghiệm với Frontend development",
          "Thành thạo JavaScript, HTML5, CSS3",
          "Kinh nghiệm sâu với React và các framework frontend hiện đại",
          "Hiểu biết tốt về state management (Redux, Context API)",
          "Kinh nghiệm làm việc với RESTful APIs và GraphQL",
        ],
        benefits: [
          "Mức lương cạnh tranh và xét duyệt định kỳ",
          "Bảo hiểm sức khỏe toàn diện",
          "Lịch làm việc linh hoạt và cơ hội làm việc từ xa",
          "Môi trường làm việc năng động và sáng tạo",
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postType: "hiring",
        status: "active",
        views: 145,
        author: employer1,
      },
      {
        title: "UX/UI Designer",
        location: "Hồ Chí Minh",
        salary: "20-25 triệu",
        salaryMin: 20000000,
        salaryMax: 25000000,
        category: "design",
        type: "full-time",
        experience: "senior",
        description:
          "Chúng tôi đang tìm kiếm UX/UI Designer tài năng để thiết kế và phát triển trải nghiệm người dùng cho các sản phẩm số. Bạn sẽ là một phần của team thiết kế sáng tạo và làm việc chặt chẽ với các nhà phát triển để tạo ra những trải nghiệm người dùng tuyệt vời.",
        requirements: [
          "Ít nhất 4 năm kinh nghiệm làm UX/UI Designer",
          "Portfolio thể hiện kỹ năng thiết kế UI/UX",
          "Thành thạo Figma, Adobe XD, Sketch",
          "Hiểu biết về nguyên tắc thiết kế tương tác và trải nghiệm người dùng",
          "Kỹ năng giao tiếp và thuyết trình tốt",
        ],
        benefits: [
          "Môi trường làm việc quốc tế, năng động",
          "Cơ hội học hỏi và phát triển kỹ năng",
          "Chế độ lương thưởng hấp dẫn",
          "Các hoạt động team building thường xuyên",
        ],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        postType: "hiring",
        status: "active",
        views: 98,
        author: employer2,
      },
      {
        title: "Backend Developer (Node.js)",
        location: "Đà Nẵng",
        salary: "18-22 triệu",
        salaryMin: 18000000,
        salaryMax: 22000000,
        category: "software",
        type: "full-time",
        experience: "mid",
        description:
          "Tôi là một Backend Developer với 4 năm kinh nghiệm, tìm kiếm cơ hội việc làm mới trong lĩnh vực phát triển ứng dụng web. Có kinh nghiệm làm việc với Node.js, Express, và các cơ sở dữ liệu như MongoDB và PostgreSQL.",
        requirements: [
          "Kinh nghiệm với Node.js và Express",
          "Hiểu biết về RESTful APIs và GraphQL",
          "Kinh nghiệm với MongoDB và PostgreSQL",
          "Kiến thức về Docker và CI/CD",
          "Kỹ năng tối ưu hóa hiệu suất và bảo mật",
        ],
        benefits: [
          "Môi trường làm việc chuyên nghiệp",
          "Cơ hội phát triển kỹ năng",
          "Lương thưởng cạnh tranh",
          "Chế độ phúc lợi hấp dẫn",
        ],
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        postType: "seeking",
        status: "active",
        views: 45,
        author: jobSeeker1,
      },
      {
        title: "HR Manager",
        location: "Hà Nội",
        salary: "25-30 triệu",
        salaryMin: 25000000,
        salaryMax: 30000000,
        category: "hr",
        type: "full-time",
        experience: "senior",
        description:
          "Nhà quản lý nhân sự có 7 năm kinh nghiệm trong lĩnh vực tuyển dụng và phát triển nhân tài cho các công ty công nghệ. Tìm kiếm vị trí HR Manager tại các công ty đang phát triển.",
        requirements: [
          "Kinh nghiệm quản lý nhân sự trong lĩnh vực công nghệ",
          "Kiến thức về luật lao động và chính sách nhân sự",
          "Kỹ năng tuyển dụng và đào tạo",
          "Khả năng xây dựng và thực hiện chiến lược nhân sự",
          "Kỹ năng giao tiếp và giải quyết vấn đề tốt",
        ],
        benefits: [
          "Môi trường làm việc chuyên nghiệp",
          "Cơ hội phát triển sự nghiệp",
          "Chế độ lương thưởng hấp dẫn",
          "Phúc lợi xã hội đầy đủ",
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postType: "seeking",
        status: "active",
        views: 32,
        author: jobSeeker2,
      },
      {
        title: "Project Manager",
        location: "Hà Nội",
        salary: "30-35 triệu",
        salaryMin: 30000000,
        salaryMax: 35000000,
        category: "project-management",
        type: "full-time",
        experience: "senior",
        description:
          "Chúng tôi đang tìm kiếm một Project Manager để quản lý và triển khai các dự án phát triển phần mềm. Bạn sẽ làm việc với các team kỹ thuật và khách hàng để đảm bảo dự án được hoàn thành đúng tiến độ và chất lượng.",
        requirements: [
          "Tối thiểu 5 năm kinh nghiệm quản lý dự án phần mềm",
          "Chứng chỉ PMP hoặc Agile/Scrum Master là một lợi thế",
          "Kỹ năng giao tiếp và thuyết trình tốt",
          "Khả năng quản lý rủi ro và giải quyết vấn đề hiệu quả",
          "Kinh nghiệm làm việc với các phương pháp Agile",
        ],
        benefits: [
          "Mức lương cạnh tranh cùng các khoản thưởng theo dự án",
          "Cơ hội đào tạo và phát triển chuyên môn",
          "Môi trường làm việc chuyên nghiệp, năng động",
          "Chế độ phúc lợi hấp dẫn",
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postType: "hiring",
        status: "active",
        views: 75,
        author: employer1,
      },
      {
        title: "DevOps Engineer",
        location: "Hồ Chí Minh",
        salary: "25-30 triệu",
        salaryMin: 25000000,
        salaryMax: 30000000,
        category: "software",
        type: "full-time",
        experience: "mid",
        description:
          "Chúng tôi đang tìm kiếm DevOps Engineer để xây dựng và duy trì hệ thống CI/CD, quản lý cơ sở hạ tầng cloud, và tối ưu hóa quy trình phát triển phần mềm.",
        requirements: [
          "Kinh nghiệm với Docker và Kubernetes",
          "Kiến thức về AWS hoặc Azure",
          "Kinh nghiệm với CI/CD tools (Jenkins, GitLab CI)",
          "Kỹ năng scripting (Python, Bash)",
          "Hiểu biết về monitoring và logging",
        ],
        benefits: [
          "Môi trường làm việc hiện đại",
          "Cơ hội học hỏi công nghệ mới",
          "Lương thưởng cạnh tranh",
          "Chế độ phúc lợi tốt",
        ],
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        postType: "hiring",
        status: "active",
        views: 88,
        author: employer2,
      },
      {
        title: "Mobile Developer (React Native)",
        location: "Hà Nội",
        salary: "20-25 triệu",
        salaryMin: 20000000,
        salaryMax: 25000000,
        category: "software",
        type: "full-time",
        experience: "mid",
        description:
          "Chúng tôi đang tìm kiếm Mobile Developer có kinh nghiệm với React Native để phát triển ứng dụng di động cho nền tảng iOS và Android.",
        requirements: [
          "Kinh nghiệm với React Native",
          "Kiến thức về JavaScript/TypeScript",
          "Hiểu biết về mobile app architecture",
          "Kinh nghiệm với Redux hoặc MobX",
          "Kỹ năng tối ưu hóa hiệu suất ứng dụng",
        ],
        benefits: [
          "Môi trường làm việc năng động",
          "Cơ hội phát triển kỹ năng",
          "Lương thưởng cạnh tranh",
          "Chế độ phúc lợi hấp dẫn",
        ],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postType: "hiring",
        status: "active",
        views: 92,
        author: employer1,
      },
    ];

    const createdJobs = await Job.insertMany(jobs);
    console.log(`✅ Đã thêm ${createdJobs.length} công việc mẫu`);

    return createdJobs;
  } catch (error) {
    console.error("❌ Lỗi khi tạo công việc mẫu:", error);
    process.exit(1);
  }
};

// Tạo mẫu cuộc hội thoại và tin nhắn
const createConversationsAndMessages = async (users, jobs) => {
  try {
    await Conversation.deleteMany();
    await Message.deleteMany();

    const employer1 = users[0]._id;
    const employer2 = users[1]._id;
    const jobSeeker1 = users[2]._id;
    const jobSeeker2 = users[3]._id;

    const job1 = jobs[0]._id;
    const job2 = jobs[1]._id;

    const conversation1 = new Conversation({
      participants: [employer1, jobSeeker1],
      relatedJob: job1,
      unreadCount: 1,
    });

    const conversation2 = new Conversation({
      participants: [employer2, jobSeeker2],
      relatedJob: job2,
      unreadCount: 2,
    });

    await conversation1.save();
    await conversation2.save();

    const messages1 = [
      {
        sender: jobSeeker1,
        receiver: employer1,
        content:
          "Xin chào, tôi rất quan tâm đến vị trí Frontend Developer tại công ty của bạn. Tôi có thể tìm hiểu thêm về cơ hội này không?",
        read: true,
        conversationId: conversation1._id,
        relatedJob: job1,
      },
      {
        sender: employer1,
        receiver: jobSeeker1,
        content:
          "Chào bạn, cảm ơn bạn đã quan tâm đến vị trí của chúng tôi. Bạn có thể gửi CV và portfolio để chúng tôi xem xét không?",
        read: true,
        conversationId: conversation1._id,
        relatedJob: job1,
      },
      {
        sender: jobSeeker1,
        receiver: employer1,
        content:
          "Tôi đã nộp đơn ứng tuyển và đính kèm CV của mình. Bạn có thể cho tôi biết thêm về quy trình phỏng vấn không?",
        read: false,
        conversationId: conversation1._id,
        relatedJob: job1,
      },
    ];

    const messages2 = [
      {
        sender: jobSeeker2,
        receiver: employer2,
        content:
          "Xin chào, tôi thấy công ty bạn đang tuyển UX/UI Designer. Tôi muốn ứng tuyển vị trí này.",
        read: true,
        conversationId: conversation2._id,
        relatedJob: job2,
      },
      {
        sender: employer2,
        receiver: jobSeeker2,
        content:
          "Chào bạn, cảm ơn vì sự quan tâm. Bạn có thể chia sẻ portfolio của mình không?",
        read: true,
        conversationId: conversation2._id,
        relatedJob: job2,
      },
      {
        sender: jobSeeker2,
        receiver: employer2,
        content:
          "Tôi đã gửi portfolio qua email của công ty. Bạn có thể xác nhận đã nhận được không?",
        read: false,
        conversationId: conversation2._id,
        relatedJob: job2,
      },
      {
        sender: jobSeeker2,
        receiver: employer2,
        content:
          "Ngoài ra, tôi có một số câu hỏi về quy trình làm việc và công nghệ mà team của bạn đang sử dụng.",
        read: false,
        conversationId: conversation2._id,
        relatedJob: job2,
      },
    ];

    const createdMessages1 = await Message.insertMany(messages1);
    const createdMessages2 = await Message.insertMany(messages2);

    conversation1.lastMessage =
      createdMessages1[createdMessages1.length - 1]._id;
    conversation2.lastMessage =
      createdMessages2[createdMessages2.length - 1]._id;

    await conversation1.save();
    await conversation2.save();

    console.log(
      `✅ Đã thêm ${
        createdMessages1.length + createdMessages2.length
      } tin nhắn mẫu trong ${2} cuộc hội thoại`
    );
  } catch (error) {
    console.error("❌ Lỗi khi tạo cuộc hội thoại và tin nhắn mẫu:", error);
    process.exit(1);
  }
};

// Tạo mẫu thông báo
const createNotifications = async (users, jobs) => {
  try {
    await Notification.deleteMany();

    const employer1 = users[0]._id;
    const employer2 = users[1]._id;
    const jobSeeker1 = users[2]._id;
    const jobSeeker2 = users[3]._id;


    const notifications = [
      {
        recipient: jobSeeker1,
        type: "message",
        message: "Bạn có tin nhắn mới từ Nguyễn Văn A",
        relatedEntity: null,
        onModel: "Message",
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }
    ];

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Đã thêm ${createdNotifications.length} thông báo mẫu`);
  } catch (error) {
    console.error("❌ Lỗi khi tạo thông báo mẫu:", error);
    process.exit(1);
  }
};

// Hàm chính để seed dữ liệu
const seedData = async () => {
  try {
    const users = await createUsers();
    const jobs = await createJobs(users);
    await createConversationsAndMessages(users, jobs);
    await createNotifications(users, jobs);

    console.log("✅ Hoàn thành việc thêm dữ liệu mẫu vào database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

// Thực hiện seed dữ liệu
seedData();
