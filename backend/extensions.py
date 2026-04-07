"""
Shared Flask extensions.

Import these from models/routes to avoid circular imports with app.py.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

