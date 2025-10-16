import time
import keyboard
import threading
import sys


class AutoKeyPress:
    def __init__(self, interval=0.3):
        self.interval = interval
        self.is_running = False
        self.thread = None

    def start(self):
        """Start pressing the '1' key at regular intervals"""
        if self.is_running:
            print("Already running!")
            return

        self.is_running = True
        print(f"Started pressing '1' key every {self.interval} seconds")
        print("Press 'Esc' to stop the program")

        # Create and start the key pressing thread
        self.thread = threading.Thread(target=self._key_press_loop)
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        """Stop the key pressing"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        print("Stopped pressing keys")

    def _key_press_loop(self):
        """The main loop that presses the key at intervals"""
        while self.is_running:
            keyboard.press_and_release('1')
            time.sleep(self.interval)

    def wait_for_exit(self):
        """Wait for the user to press Escape to exit"""
        keyboard.wait('esc')
        self.stop()
        print("Program exited")
        sys.exit(0)


if __name__ == "__main__":
    print("Auto Key Press Program")
    print("This program will press the '1' key every 300 milliseconds")
    print("Press 'Esc' at any time to exit the program")
    print("Starting in 2 seconds...")
    time.sleep(2)

    # Create and start the auto key press
    auto_key = AutoKeyPress(interval=0.3)  # 300 ms = 0.3 seconds
    auto_key.start()

    # Wait for exit command
    auto_key.wait_for_exit()