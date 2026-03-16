#!/usr/bin/env python3
"""
Backend API Testing for Lekha Digital Black Book Management System
Tests authentication, role-based access, file management, meeting logs, and admin functions
"""

import requests
import sys
import json
from datetime import datetime
import os

class LekhaAPITester:
    def __init__(self, base_url="https://digital-blackbook.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different roles
        self.user_data = {}  # Store user data for different roles
        self.tests_run = 0
        self.tests_passed = 0

    def log(self, message, status="INFO"):
        status_colors = {
            "INFO": "\033[94m",
            "SUCCESS": "\033[92m", 
            "ERROR": "\033[91m",
            "WARNING": "\033[93m"
        }
        print(f"{status_colors.get(status, '')}{message}\033[0m")

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}... {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ Passed - Status: {response.status_code}", "SUCCESS")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ Failed - Expected {expected_status}, got {response.status_code}", "ERROR")
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data.get('error', 'Unknown error')}", "ERROR")
                except:
                    self.log(f"   Response: {response.text[:200]}", "ERROR")

        except Exception as e:
            self.log(f"❌ Failed - Network/Request Error: {str(e)}", "ERROR")

        return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        self.log("\n=== Testing Health Check ===", "INFO")
        return self.run_test(
            "Health Check",
            "GET", 
            "api/health", 
            200,
            description="Basic API availability"
        )

    def test_login(self, email, password, role_name):
        """Test login for different roles"""
        self.log(f"\n=== Testing {role_name} Login ===", "INFO")
        success, response = self.run_test(
            f"{role_name} Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password},
            description=f"Login as {role_name}"
        )
        
        if success and 'token' in response:
            self.tokens[role_name.lower()] = response['token']
            self.user_data[role_name.lower()] = response['user']
            self.log(f"✅ {role_name} token stored successfully", "SUCCESS")
            return True
        return False

    def test_protected_route(self, role, endpoint, expected_status=200):
        """Test protected routes with role-based access"""
        token = self.tokens.get(role.lower())
        if not token:
            self.log(f"❌ No token for {role}, skipping protected route test", "ERROR")
            return False
            
        return self.run_test(
            f"{role} Protected Access",
            "GET",
            endpoint,
            expected_status,
            token=token,
            description=f"Role-based access for {role}"
        )

    def test_student_workflow(self):
        """Test student-specific functionality"""
        self.log("\n=== Testing Student Workflow ===", "INFO")
        token = self.tokens.get('student')
        if not token:
            self.log("❌ Student token not available", "ERROR")
            return False

        # Test dashboard stats
        success, stats = self.run_test(
            "Student Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200,
            token=token,
            description="Fetch student dashboard statistics"
        )

        # If student has group_id, test file and meeting operations
        if success and stats.get('group_info', {}).get('group_id'):
            group_id = stats['group_info']['group_id']
            
            # Test getting files for group
            self.run_test(
                "Get Student Files",
                "GET", 
                f"api/files/group/{group_id}",
                200,
                token=token,
                description="Fetch uploaded files"
            )
            
            # Test getting meetings for group
            self.run_test(
                "Get Student Meetings",
                "GET",
                f"api/meetings/group/{group_id}",
                200, 
                token=token,
                description="Fetch meeting logs"
            )

        return success

    def test_guide_workflow(self):
        """Test guide-specific functionality"""
        self.log("\n=== Testing Guide Workflow ===", "INFO")
        token = self.tokens.get('guide')
        if not token:
            self.log("❌ Guide token not available", "ERROR")
            return False

        user_id = self.user_data.get('guide', {}).get('user_id')
        
        # Test dashboard stats
        self.run_test(
            "Guide Dashboard Stats",
            "GET",
            "api/dashboard/stats", 
            200,
            token=token,
            description="Fetch guide dashboard statistics"
        )
        
        # Test getting assigned projects
        if user_id:
            self.run_test(
                "Guide Projects",
                "GET",
                f"api/projects/guide/{user_id}",
                200,
                token=token,
                description="Fetch assigned projects"
            )

        # Test getting all projects (guide should have access)
        return self.run_test(
            "All Projects Access",
            "GET",
            "api/projects",
            200,
            token=token,
            description="Access all projects list"
        )

    def test_admin_workflow(self):
        """Test admin-specific functionality"""
        self.log("\n=== Testing Admin Workflow ===", "INFO")
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ Admin token not available", "ERROR")
            return False

        # Test dashboard stats
        self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200,
            token=token,
            description="Fetch admin dashboard statistics"
        )

        # Test user management
        success, users = self.run_test(
            "Admin Users List",
            "GET", 
            "api/admin/users",
            200,
            token=token,
            description="Fetch all users"
        )

        # Test getting guides list
        self.run_test(
            "Admin Guides List",
            "GET",
            "api/admin/guides", 
            200,
            token=token,
            description="Fetch guides for assignment"
        )

        # Test getting unassigned students
        self.run_test(
            "Unassigned Students",
            "GET",
            "api/admin/students/unassigned",
            200,
            token=token,
            description="Fetch students without groups"
        )

        return success

    def test_authentication_scenarios(self):
        """Test various authentication scenarios"""
        self.log("\n=== Testing Authentication Scenarios ===", "INFO")
        
        # Test login with invalid credentials
        self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"},
            description="Should fail with invalid credentials"
        )

        # Test accessing protected route without token
        self.run_test(
            "Unauthorized Access",
            "GET", 
            "api/dashboard/stats",
            401,
            description="Should fail without authentication"
        )

        # Test me endpoint with valid token
        if self.tokens.get('student'):
            self.run_test(
                "Get Current User",
                "GET",
                "api/auth/me",
                200,
                token=self.tokens['student'],
                description="Get authenticated user info"
            )

        return True

    def test_role_based_access(self):
        """Test role-based access control"""
        self.log("\n=== Testing Role-Based Access Control ===", "INFO")
        
        # Test student trying to access admin endpoint
        if self.tokens.get('student'):
            self.run_test(
                "Student Admin Access",
                "GET",
                "api/admin/users",
                403,
                token=self.tokens['student'],
                description="Student should not access admin endpoints"
            )

        # Test guide accessing admin functions
        if self.tokens.get('guide'):
            self.run_test(
                "Guide Admin Users Access",
                "GET",
                "api/admin/users", 
                200,  # Guide might have access to users list
                token=self.tokens['guide'],
                description="Guide access to user management"
            )

        return True

    def run_comprehensive_test(self):
        """Run all tests in logical order"""
        self.log("🚀 Starting Lekha API Comprehensive Testing", "INFO")
        self.log("=" * 60, "INFO")
        
        # Health check first
        if not self.test_health_check()[0]:
            self.log("❌ Health check failed - API may be down", "ERROR")
            return False

        # Test authentication for all roles
        test_credentials = [
            ("admin@lekha.com", "admin123", "Admin"),
            ("guide@lekha.com", "guide123", "Guide"), 
            ("student@lekha.com", "student123", "Student")
        ]

        login_success = True
        for email, password, role in test_credentials:
            if not self.test_login(email, password, role):
                login_success = False
                self.log(f"❌ Failed to login as {role}", "ERROR")

        if not login_success:
            self.log("❌ Authentication tests failed - stopping", "ERROR")
            return False

        # Test authentication scenarios
        self.test_authentication_scenarios()

        # Test role-based access control
        self.test_role_based_access()

        # Test role-specific workflows
        self.test_student_workflow()
        self.test_guide_workflow() 
        self.test_admin_workflow()

        # Print final results
        self.print_results()
        return self.tests_passed == self.tests_run

    def print_results(self):
        """Print final test results"""
        self.log("\n" + "=" * 60, "INFO")
        self.log("📊 FINAL TEST RESULTS", "INFO")
        self.log("=" * 60, "INFO")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        self.log(f"Total Tests Run: {self.tests_run}", "INFO")
        self.log(f"Tests Passed: {self.tests_passed}", "SUCCESS" if self.tests_passed > 0 else "ERROR")
        self.log(f"Tests Failed: {self.tests_run - self.tests_passed}", "ERROR" if self.tests_passed < self.tests_run else "INFO")
        self.log(f"Success Rate: {success_rate:.1f}%", "SUCCESS" if success_rate >= 80 else "WARNING")
        
        if success_rate >= 80:
            self.log("🎉 Overall Status: PASSED", "SUCCESS")
        else:
            self.log("⚠️  Overall Status: NEEDS ATTENTION", "WARNING")

def main():
    tester = LekhaAPITester()
    
    try:
        success = tester.run_comprehensive_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        tester.log("\n❌ Testing interrupted by user", "WARNING")
        return 1
    except Exception as e:
        tester.log(f"\n❌ Unexpected error during testing: {str(e)}", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())