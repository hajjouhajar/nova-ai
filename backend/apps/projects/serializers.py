from rest_framework import serializers
from .models import Project, Task


class TaskSerializer(serializers.ModelSerializer):
    projectId = serializers.PrimaryKeyRelatedField(
        source='project', queryset=Project.objects.all(), required=False, allow_null=True
    )
    project = serializers.CharField(source='project.name', read_only=True)
    due = serializers.DateField(source='due_date', required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'project', 'projectId', 'priority', 'status', 'due', 'category']


class ProjectSerializer(serializers.ModelSerializer):
    desc = serializers.CharField(source='description', required=False, allow_blank=True)
    taskCount = serializers.SerializerMethodField()
    done = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'desc', 'color', 'deadline', 'taskCount', 'done', 'created_at']

    def get_taskCount(self, obj):
        return obj.tasks.count()

    def get_done(self, obj):
        return obj.tasks.filter(status='terminé').count()