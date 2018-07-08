process.env["REDIS_DEV_URL"] = "redis://localhost:6379";
process.env["REDIS_TEST_URL"] = "redis://localhost:6380";

if(process.env.NODE_ENV == "dev"){
  process.env["REDIS_URL"] = process.env.REDIS_DEV_URL;
} else {
  process.env["REDIS_URL"] = process.env.REDIS_TEST_URL;
}
