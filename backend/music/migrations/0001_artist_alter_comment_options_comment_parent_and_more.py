# Generated by Django 5.0.1 on 2025-05-02 09:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', 'create_lyricline_model'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Artist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('bio', models.TextField(blank=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='artist_images/')),
            ],
            options={
                'db_table': 'artists',
            },
        ),
        migrations.AlterModelOptions(
            name='comment',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='comment',
            name='parent',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='music.comment'),
        ),
        migrations.AddField(
            model_name='genre',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='genre_images/'),
        ),
        migrations.AddField(
            model_name='song',
            name='release_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='comment',
            name='song',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='music.song'),
        ),
        migrations.AlterModelTable(
            name='comment',
            table='comments',
        ),
        migrations.CreateModel(
            name='Queue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='queue', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'queues',
            },
        ),
        migrations.CreateModel(
            name='QueueItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('position', models.PositiveIntegerField()),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('queue', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='music.queue')),
                ('song', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='music.song')),
            ],
            options={
                'db_table': 'queue_items',
                'ordering': ['position'],
                'unique_together': {('queue', 'position')},
            },
        ),
        migrations.AddField(
            model_name='queue',
            name='songs',
            field=models.ManyToManyField(through='music.QueueItem', to='music.song'),
        ),
        migrations.CreateModel(
            name='UserStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status_text', models.CharField(blank=True, max_length=255)),
                ('is_listening', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('currently_playing', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='music.song')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='music_status', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_statuses',
            },
        ),
    ]
