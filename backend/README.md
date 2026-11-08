# Dayflow Complete PHP RESTful API & MySQL Setup

This backend implements a full RESTful API with PHP and PDO for Dayflow.

## 1. Create the Database in MySQL
Execute the schema in your MySQL / MariaDB server (via phpMyAdmin, MySQL Workbench, or CLI):
```bash
mysql -u root -p < schema.sql
```
This automatically creates `dayflow_db` and seeds the tables:
- `activities` (Tasks, dates, times, deadlines, categories, coordinates, and attachments)
- `categories` (Academic & Personal categories, colors, and icons)
- `notifications` (Upcoming, deadline, and overdue notifications)
- `user_profile` (Name, contact information, and preference toggles)

## 2. Configure Database Credentials
Edit `config.php` if your MySQL username, password, or port is different from the defaults:
```php
$host = '127.0.0.1';
$port = '3306';
$db   = 'dayflow_db';
$user = 'root';
$pass = '';
```

## 3. Run the API Server
Run inside the `backend` folder with PHP's built-in web server:
```bash
php -S localhost:8000
```
Or copy this `backend` folder into your Apache/XAMPP `htdocs` directory (e.g. `C:\xampp\htdocs\dayflow-api`).

## 4. API Endpoints Reference

### Activities (`activities.php`)
- `GET /activities.php` - Fetch all activities
- `GET /activities.php?id=1` - Fetch a single activity
- `POST /activities.php` - Create an activity
- `PUT /activities.php?id=1` - Update an activity
- `DELETE /activities.php?id=1` - Delete an activity

### Categories (`categories.php`)
- `GET /categories.php` - Fetch all categories
- `GET /categories.php?id=cat-assignments` - Fetch single category
- `POST /categories.php` - Create custom category
- `PUT /categories.php?id=cat-custom-1` - Update category
- `DELETE /categories.php?id=cat-custom-1` - Delete category

### Notifications (`notifications.php`)
- `GET /notifications.php` - Fetch all notifications
- `PUT /notifications.php?id=1` - Mark notification as read
- `PUT /notifications.php?action=mark-all-read` - Mark all notifications as read
- `DELETE /notifications.php?id=1` - Delete notification

### User Profile (`profile.php`)
- `GET /profile.php` - Fetch user profile & preferences
- `PUT /profile.php` - Update user profile & preferences
