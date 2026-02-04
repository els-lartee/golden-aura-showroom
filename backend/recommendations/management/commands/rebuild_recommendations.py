from django.core.management.base import BaseCommand

from recommendations.scoring import rebuild_recommendations_for_all_users


class Command(BaseCommand):
    help = "Rebuild recommendation scores for all users based on events."

    def handle(self, *args, **options):
        rebuild_recommendations_for_all_users()
        self.stdout.write(self.style.SUCCESS("Recommendations rebuilt."))