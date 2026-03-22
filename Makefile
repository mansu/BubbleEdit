.PHONY: install dev server frontend

install:
	npm install
	cd server && npm install

server:
	cd server && npm run dev

frontend:
	npm run dev

dev:
	@echo "Starting server and frontend..."
	@cd server && npm run dev & npm run dev
