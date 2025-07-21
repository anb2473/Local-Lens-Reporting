from locust import HttpUser, task, between

# This is a system to stress test the global router service

class WebsiteUser(HttpUser):
    wait_time = between(1, 3) # 1 to 3 seconds

    @task
    def test_home_page(self):
        self.client.get("/")