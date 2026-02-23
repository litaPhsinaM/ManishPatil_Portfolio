export interface Project {
  title: string;
  description: string;
  image: string;
  link: string;
  tags: string[];
  category: "Systems & Infrastructure" | "AI & Deep Learning" | "Data Science & Analytics" | "Software Engineering";
}

export const projects: Project[] = [
  // --- Systems & Infrastructure ---
  {
    title: "Azure Olympics Data Engineering",
    description: "A high-performance end-to-end data pipeline built on Azure. I orchestrated data ingestion from various sources using Azure Data Factory, performed complex transformations with Spark on Azure Databricks, and channeled the processed data into Azure Synapse Analytics for large-scale warehousing. This project demonstrates a production-grade approach to handling massive datasets with high reliability and scalability.",
    image: "Azure DE.png",
    link: "https://github.com/litaPhsinaM/Tokyo-Olympics-Azure-DE-Project",
    tags: ["Azure", "Data Factory", "Databricks", "Synapse", "Spark"],
    category: "Systems & Infrastructure"
  },
  {
    title: "Uber Data Engineering Pipeline",
    description: "Engineered a robust data pipeline on Google Cloud Platform to process and analyze massive Uber trip datasets. I utilized Mage (a modern data orchestrator) on Google Compute Engine for automated transformations and stored the refined data in BigQuery. The project culminates in a dynamic Google Data Studio dashboard that provides real-time mobility insights.",
    image: "architecture.jpg",
    link: "https://github.com/litaPhsinaM/UBER-DATA-ENGINEERING-PIPELINE-AND-DASHBOARD-CREATION",
    tags: ["GCP", "Mage", "BigQuery", "Data Modeling"],
    category: "Systems & Infrastructure"
  },
  {
    title: "SQL Data Cleaning (Housing)",
    description: "Transformed raw, fragmented housing data into an analytical-ready dataset using advanced SQL techniques. I implemented complex transformations to standardize temporal data, resolved missing spatial info, and utilized CTEs to eliminate redundancy. Mastery in the critical preparation phase of the data lifecycle.",
    image: "kirkpatrick-park-01-1600x900.jpg",
    link: "https://github.com/litaPhsinaM/Data-Cleaning-with-SQL-Housing-Database-/blob/main/Data%20Cleaning%20using%20SQL.sql",
    tags: ["SQL Server", "Data Transformation", "Database Optimization"],
    category: "Systems & Infrastructure"
  },

  // --- AI & Deep Learning ---

  {
    title: "3D Shape Classification (CNN)",
    description: "Developed a custom Convolutional Neural Network (CNN) architecture using PyTorch to solve complex 3D geometric classification challenges. By implementing advanced preprocessing techniques, including image augmentation and precise normalization, the model achieved a remarkable validation accuracy of 99.77%. This project showcases deep expertise in computer vision and deep learning frameworks.",
    image: "3d shapes.png",
    link: "https://github.com/litaPhsinaM/IMAGE-CLASSIFICATION-ON-3D-GEOMETRIC-SHAPES-USING-CNN-MODEL-WITH-PYTORCH/blob/main/cnn_3d_objects.ipynb",
    tags: ["Deep Learning", "PyTorch", "CNN", "Computer Vision"],
    category: "AI & Deep Learning"
  },
  {
    title: "LangChain Web Scraper",
    description: "A technical implementation of automated web scraping for high-fidelity data retrieval using LangChain and BeautifulSoup. The system utilizes AI-driven parsing to extract structured information from complex web sources (like IMDB), demonstrating expertise in automated data ingestion and modern AI orchestration patterns.",
    image: "langchain_scraper_coder.png",
    link: "https://github.com/litaPhsinaM/Using-LangChain-for-Web-Scraping",
    tags: ["LangChain", "AI Automation", "Web Scraping", "Python"],
    category: "AI & Deep Learning"
  },

  // --- Data Science & Analytics ---
  {
    title: "CryptoLens: Automated Analysis",
    description: "Built a sophisticated real-time cryptocurrency analysis tool using Python. The system performs automated data retrieval, normalizes complex JSON structures into Pandas DataFrames, and maintains a continuous historical dataset. It features an automated reporting layer that generates visualizations using Seaborn and Matplotlib.",
    image: "cryptooo.jpg",
    link: "https://github.com/litaPhsinaM/CryptoLens-Automated-Crypto-Analysis/blob/main/Automated%20Crypto%20Analysis.ipynb",
    tags: ["Python", "Pandas", "Real-time Data", "Automation"],
    category: "Data Science & Analytics"
  },
  {
    title: "World Population Analysis (EDA)",
    description: "A comprehensive Exploratory Data Analysis (EDA) of global population trends. I leveraged Pandas and Seaborn to perform deep-dive correlation studies and continent-level trend analysis. The project emphasizes data integrity through rigorous preprocessing and strategic trend forecasting.",
    image: "WORLD POPULATION.png",
    link: "https://github.com/litaPhsinaM/Exploratory-Data-Analysis-of-World-Population/blob/main/Exploratory%20Data%20Analysis%20in%20pandas.ipynb",
    tags: ["EDA", "Python", "Seaborn", "Data Analytics"],
    category: "Data Science & Analytics"
  },
  {
    title: "Tableau Analytical Suite",
    description: "A collection of interactive Tableau dashboards created by integrating SQL-processed data with advanced visualization techniques. These dashboards provide deep-dive insights into business metrics, featuring parameter-driven views and complex LOD expressions to reveal hidden patterns.",
    image: "IMG_2891.jpg",
    link: "https://public.tableau.com/app/profile/manish.patil6772/vizzes",
    tags: ["Tableau", "Dashboard Design", "Business Intelligence"],
    category: "Data Science & Analytics"
  },


  // --- Software Engineering ---
  {
    title: "Modern React Portfolio (v2.0)",
    description: "The very application you are browsing right now. A high-performance, responsive portfolio built with React, TypeScript, and Vite. It features a unique 'Coder' aesthetic, advanced Framer Motion parallax effects, glassmorphism UI components, and a custom tabbed navigation system. This project represents a mastery of modern frontend engineering and creative UX design.",
    image: "portfolio_v2.png",
    link: "https://github.com/litaPhsinaM/ManishPatil_Portfolio",
    tags: ["React", "TypeScript", "Framer Motion", "UI/UX"],
    category: "Software Engineering"
  },
  {
    title: "React + MySQL Full-Stack",
    description: "A full-stack application demonstrating seamless database integration with a modern React frontend. It features a robust Node.js backend managing CRUD operations against a MySQL relational database. The project highlights expertise in architectural patterns, relational modeling, and full-stack data flow.",
    image: "react_mysql_coder_preview.png",
    link: "https://github.com/litaPhsinaM/REACTMYSQL",
    tags: ["Full Stack", "MySQL", "React", "Node.js"],
    category: "Software Engineering"
  },
  {
    title: "Soccer Social Platform",
    description: "A specialized social media application designed for soccer enthusiasts. Built with a focus on community interaction and high-quality UI/UX, this platform allows users to explore and share content related to their passion for the sport. It demonstrates the ability to translate personal interests into functional, user-centric software.",
    image: "soccer_social_coder_preview.png",
    link: "https://github.com/litaPhsinaM/SOCCER_SOCIAL",
    tags: ["JavaScript", "Social Platform", "Web Development"],
    category: "Software Engineering"
  }
];

export const photos = [
  { url: "https://drscdn.500px.org/photo/1079218170/q%3D90_m%3D2048/v2?sig=0fa1454c682f409e845873b04b6145558a93d3ebe9d7f17929659376636025b0", caption: "Sunset" },
  { url: "https://drscdn.500px.org/photo/1079218140/q%3D90_m%3D2048/v2?sig=fa0f1c463b116e99ea7d9f0d0d42f7bf578ea96ab2970c865abbd751bbd9bbf7", caption: "Lake Tahoe" },
  { url: "https://drscdn.500px.org/photo/1079218111/q%3D90_m%3D2048/v2?sig=6bcda423a6e9c1e11f2abac86e201771891cbab61916648d462bc0301b450346", caption: "California" },
  { url: "https://drscdn.500px.org/photo/1079218000/q%3D90_m%3D2048/v2?sig=2c7450081329c0d0a2539d842a29888dbdc97f32ff66fd9749fdf95103fa21d5", caption: "Stargazing" },
  { url: "https://drscdn.500px.org/photo/1079217981/q%3D90_m%3D2048/v2?sig=d65bf6cdd0207d4476c0e16312840dbce0f9e6ab7ed11d1802e38cddd4044500", caption: "Meteor Showers" },
  { url: "https://drscdn.500px.org/photo/1048459191/q%3D90_m%3D2048/v2?sig=b529234e5dbedf352c6923b0a74f0fe77b864d9aeff659d9ab0f57c3f130b4f0", caption: "Yosemite" },
  { url: "https://drscdn.500px.org/photo/1026789853/q%3D90_m%3D2048/v2?sig=9c90c7db4b2b4d8bee8c3e454b09060a2d5bdc2ca51844ae0af1ce7461137ce2", caption: "Long Exposure Light Trails" },
  { url: "https://drscdn.500px.org/photo/1025299167/q%3D90_m%3D2048/v2?sig=608f519771ad17389393762130abfc42d026526daf72b392215324c878793733", caption: "Swaminarayan Temple" }
];
