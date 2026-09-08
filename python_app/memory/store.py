"""Small persistent SQLite/Postgres store, retaining the original table names."""
import json
import logging
import os
import sqlite3
from datetime import datetime, timezone


class Store:
    def __init__(self):
        self.pg = bool(os.getenv("DATABASE_URL"))
        if self.pg:
            import psycopg

            self.db = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)
        else:
            logging.getLogger(__name__).warning("DATABASE_URL absent; using local SQLite fallback")
            self.db = sqlite3.connect(os.getenv("SQLITE_PATH", "python_app/data/career.db"), check_same_thread=False)
        self.setup()

    def execute(self, sql, args=()):
        if self.pg:
            sql = sql.replace("?", "%s")
            cur = self.db.cursor()
            cur.execute(sql, tuple(self._adapt(value) for value in args))
            return cur
        cur = self.db.cursor()
        cur.execute(sql, tuple(self._adapt(value) for value in args))
        self.db.commit()
        return cur

    def _adapt(self, value):
        if self.pg:
            from psycopg.types.json import Jsonb

            if isinstance(value, (list, dict)):
                return Jsonb(value)
        elif isinstance(value, (list, dict)):
            return json.dumps(value)
        return value

    def setup(self):
        statements = [
            "CREATE TABLE IF NOT EXISTS career_profiles (id INTEGER PRIMARY KEY, name TEXT NOT NULL, headline TEXT NOT NULL, education TEXT NOT NULL, skills TEXT NOT NULL, interests TEXT NOT NULL, goals TEXT NOT NULL, target_roles TEXT NOT NULL, updated_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS career_documents (id INTEGER PRIMARY KEY, filename TEXT NOT NULL, kind TEXT NOT NULL, content TEXT NOT NULL, excerpt TEXT NOT NULL, chunks INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS resume_analyses (id INTEGER PRIMARY KEY, filename TEXT NOT NULL, score INTEGER NOT NULL, summary TEXT NOT NULL, strengths TEXT NOT NULL, improvements TEXT NOT NULL, missing_skills TEXT NOT NULL, role_matches TEXT NOT NULL, agent_trace TEXT NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS career_activities (id INTEGER PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS recruitment_candidates (id INTEGER PRIMARY KEY, filename TEXT, profile TEXT NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS recruitment_jobs (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, analysis TEXT NOT NULL, created_at TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS recruitment_interactions (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, subject TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL)",
        ]
        if self.pg:
            statements = [s.replace("INTEGER PRIMARY KEY", "SERIAL PRIMARY KEY") for s in statements]

        for sql in statements:
            self.execute(sql)

    def now(self):
        if self.pg:
            return datetime.now(timezone.utc)
        return datetime.now(timezone.utc).isoformat()

    def one(self, table, id):
        return self.execute(f"SELECT * FROM {table} WHERE id=?", (id,)).fetchone()

    def rows(self, table, limit=100):
        return self.execute(f"SELECT * FROM {table} ORDER BY id DESC LIMIT ?", (limit,)).fetchall()

    def insert(self, table, fields, values):
        marks = ",".join("?" for _ in values)
        cur = self.execute(f"INSERT INTO {table} ({','.join(fields)}) VALUES ({marks}) RETURNING id", values)
        return cur.fetchone()[0]

    def profile(self):
        row = self.execute("SELECT * FROM career_profiles ORDER BY id LIMIT 1").fetchone()
        if not row:
            now = self.now()
            self.insert(
                "career_profiles",
                ["name", "headline", "education", "skills", "interests", "goals", "target_roles", "updated_at"],
                [
                    "Aarav Mehta",
                    "Computer Science student exploring data, product, and intelligent systems",
                    "B.Tech Computer Science · graduating 2026",
                    ["Python", "SQL", "React", "Git", "Data analysis"],
                    ["Responsible AI", "Developer tools", "Climate technology"],
                    ["Land a data or AI internship", "Build a portfolio with measurable impact"],
                    ["Data Analyst", "AI Product Intern", "Machine Learning Intern"],
                    now,
                ],
            )
            row = self.execute("SELECT * FROM career_profiles ORDER BY id LIMIT 1").fetchone()
        return self.profile_dict(row)

    def profile_dict(self,r):
        def decoded(value):
            if isinstance(value, (list, dict)):
                return value
            try:
                return json.loads(value)
            except (TypeError, json.JSONDecodeError):
                return []

        return {"id":r[0],"name":r[1],"headline":r[2],"education":r[3],"skills":decoded(r[4]),"interests":decoded(r[5]),"goals":decoded(r[6]),"targetRoles":decoded(r[7]),"updatedAt":r[8]}

    def activity(self, typ, title, detail):
        self.insert("career_activities",["type","title","detail","created_at"],[typ,title,detail,self.now()])

    def interaction(self, kind, subject, payload):
        self.insert("recruitment_interactions", ["kind", "subject", "payload", "created_at"], [kind, subject, payload, self.now()])