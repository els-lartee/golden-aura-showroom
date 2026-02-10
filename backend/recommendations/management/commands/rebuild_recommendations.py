from django.core.management.base import BaseCommand

from recommendations.scoring import rebuild_dirty_users, rebuild_recommendations_for_all_users


class Command(BaseCommand):
    help = "Rebuild recommendation scores. By default only rebuilds users with new events (dirty). Use --full for all users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--full",
            action="store_true",
            help="Rebuild recommendations for ALL users, not just those with new events.",
        )

    def handle(self, *args, **options):
        if options["full"]:
            rebuild_recommendations_for_all_users()
            self.stdout.write(self.style.SUCCESS("Full recommendations rebuild complete."))
        else:
            count = rebuild_dirty_users()
            self.stdout.write(self.style.SUCCESS(f"Rebuilt recommendations for {count} user(s) with new events."))