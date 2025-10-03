import pygame
import random
import math
import sys

# Initialize Pygame
pygame.init()

# Set up the screen
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Aim Trainer")

# Colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)

# Font for displaying score, timer, and button text
font = pygame.font.SysFont("arial", 30)

# Ball properties
BALL_RADIUS = 20
MAX_BALLS = 5

# Game variables
score = 0
game_duration = 30  # 30 seconds
start_time = 0  # Will be set when game starts
balls = []
game_state = "menu"  # States: "menu", "playing", "game_over"

# Play button properties
button_width, button_height = 200, 50
button_x, button_y = WIDTH // 2 - button_width // 2, HEIGHT // 2 - button_height // 2
button_rect = pygame.Rect(button_x, button_y, button_width, button_height)

# Function to create a new ball at random position
def create_ball():
    x = random.randint(BALL_RADIUS, WIDTH - BALL_RADIUS)
    y = random.randint(BALL_RADIUS, HEIGHT - BALL_RADIUS)
    return (x, y)

# Main game loop
running = True
clock = pygame.time.Clock()

while running:
    screen.fill(WHITE)  # Clear screen

    if game_state == "menu":
        # Draw Play button
        pygame.draw.rect(screen, GREEN, button_rect)
        button_text = font.render("Play", True, BLACK)
        button_text_rect = button_text.get_rect(center=button_rect.center)
        screen.blit(button_text, button_text_rect)

        # Event handling for menu
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                mouse_x, mouse_y = event.pos
                if button_rect.collidepoint(mouse_x, mouse_y):
                    # Start game
                    game_state = "playing"
                    score = 0
                    balls = [create_ball() for _ in range(MAX_BALLS)]  # Initialize balls
                    start_time = pygame.time.get_ticks()  # Start timer

    elif game_state == "playing":
        # Calculate elapsed time
        elapsed_time = (pygame.time.get_ticks() - start_time) / 1000  # Convert to seconds
        time_left = max(0, game_duration - elapsed_time)  # Time remaining

        # Draw all balls
        for ball in balls:
            pygame.draw.circle(screen, RED, ball, BALL_RADIUS)

        # Draw score and timer
        score_text = font.render(f"Score: {score}", True, BLACK)
        timer_text = font.render(f"Time: {time_left:.1f}s", True, BLACK)
        screen.blit(score_text, (10, 10))
        screen.blit(timer_text, (10, 50))

        # Event handling for gameplay
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                mouse_x, mouse_y = event.pos
                # Check if click is on any ball
                for ball in balls[:]:  # Copy list to avoid modification issues
                    ball_x, ball_y = ball
                    distance = math.sqrt((mouse_x - ball_x)**2 + (mouse_y - ball_y)**2)
                    if distance <= BALL_RADIUS:
                        balls.remove(ball)
                        score += 1  # Increment score
                        balls.append(create_ball())  # Spawn a new ball

        # If balls are less than max, occasionally add more
        if len(balls) < MAX_BALLS and random.random() < 0.01:
            balls.append(create_ball())

        # Check if time is up
        if time_left <= 0:
            game_state = "game_over"
            end_time = pygame.time.get_ticks()  # Mark time for game over screen

    elif game_state == "game_over":
        # Calculate average hits per second
        avg_hits = score / game_duration if score > 0 else 0
        # Display final stats
        final_score_text = font.render(f"Final Score: {score}", True, BLACK)
        avg_text = font.render(f"Average Hits/s: {avg_hits:.2f}", True, BLACK)
        screen.blit(final_score_text, (WIDTH // 2 - 100, HEIGHT // 2 - 20))
        screen.blit(avg_text, (WIDTH // 2 - 100, HEIGHT // 2 + 20))

        # Return to menu after 3 seconds
        if (pygame.time.get_ticks() - end_time) / 1000 >= 3:
            game_state = "menu"

        # Event handling for game over (allow quitting)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

    pygame.display.flip()
    clock.tick(60)  # 60 FPS

pygame.quit()
sys.exit()